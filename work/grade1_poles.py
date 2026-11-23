"""Infer a single-sided pole run along each connected grade-one alley."""
import math

import shapely as S
from shapely.geometry import LineString, Point, mapping, shape
from shapely.ops import unary_union

# Scene target within the 30–40 m design examples; not a statutory interval.
TARGET_SPAN = 32
MIN_SPAN = 14
MAX_SPAN = 45
POLE_RADIUS = .22


def road_candidates(line, side, road, boundary, blocked, allowed, previous):
    for sample in range(3, int(line.length) - 2, 2):
        center = line.interpolate(sample)
        before = line.interpolate(sample - 1)
        after = line.interpolate(sample + 1)
        length = before.distance(after)
        if length < .1 or not road.covers(center):
            continue
        ux, uz = (after.x - before.x) / length, (after.y - before.y) / length
        nx, nz = -uz * side, ux * side
        ray = LineString([center, (center.x + nx * 4.2, center.y + nz * 4.2)])
        hits = [point for point in S.get_parts(boundary.intersection(ray)) if point.geom_type == 'Point']
        if not hits:
            continue
        edge = min(hits, key=center.distance)
        for offset in (.36, .55, .8):
            point = Point(edge.x + nx * offset, edge.y + nz * offset)
            footprint = point.buffer(POLE_RADIUS)
            if (
                allowed.covers(footprint)
                and not blocked.intersects(footprint)
                and not road.intersects(footprint)
                and all(point.distance(other) >= 7 for other in previous)
            ):
                yield sample, dict(point=[point.x, point.y], nx=nx, nz=nz, ux=ux, uz=uz, height=7.5, grade=1)
                break


def span_clear(a, b, alley, buildings):
    points = a['point'], b['point']
    distance = math.dist(*points)
    if not MIN_SPAN <= distance <= MAX_SPAN:
        return False
    # Check the pole line and the width of the road-facing conductors.
    for offset in (0, -.18, -.55, -.92):
        wire = LineString([(x + offset * p['nx'], z + offset * p['nz']) for p, (x, z) in zip((a, b), points)])
        if not alley.covers(wire) or buildings.intersects(wire.buffer(.24)):
            return False
    return True


def build_side(candidates, alley, buildings):
    runs = []
    while len(candidates) > 1:
        start, pole = candidates[0]
        options = [
            (abs(length - TARGET_SPAN), index)
            for index, (sample, other) in enumerate(candidates[1:], 1)
            if sample - start <= MAX_SPAN + 4
            and MIN_SPAN <= (length := math.dist(pole['point'], other['point'])) <= MAX_SPAN
        ]
        if runs and runs[-1][-1] is pole and candidates[-1][0] - start < TARGET_SPAN * .75:
            break
        for _, index in sorted(options):
            if span_clear(pole, candidates[index][1], alley, buildings):
                if not runs or runs[-1][-1] is not pole:
                    runs.append([pole])
                runs[-1].append(candidates[index][1])
                candidates = candidates[index:]
                break
        else:
            candidates = candidates[1:]
    return runs


def plan_poles(centerlines, road, buildings, blocked, allowed):
    """Return local-metre poles and index pairs for unobstructed alley runs."""
    poles, links, previous = [], [], []
    # Clipping can leave zero-area line remnants beside the pavement.
    # GeometryCollection has no boundary; pole edges belong to its area only.
    road = road.buffer(0)
    if road.is_empty:
        return poles, links
    boundary = road.boundary
    for line in centerlines:
        alley = line.buffer(4.8)
        sides = [
            build_side(list(road_candidates(line, side, road, boundary, blocked, allowed, previous)), alley, buildings)
            for side in (1, -1)
        ]
        def score(runs):
            lengths = [math.dist(a['point'], b['point']) for run in runs for a, b in zip(run, run[1:])]
            return len(lengths) * TARGET_SPAN - sum(abs(length - TARGET_SPAN) for length in lengths)

        runs = max(sides, key=score)
        for run in runs:
            distance_since_light = 0
            for i, pole in enumerate(run):
                if i:
                    distance_since_light += math.dist(run[i - 1]['point'], pole['point'])
                pole['lamp'] = i in (0, len(run) - 1) or distance_since_light >= 55
                if pole['lamp']:
                    distance_since_light = 0
            start = len(poles)
            poles.extend(run)
            previous.extend(Point(pole['point']) for pole in run)
            links.extend((start + i, start + i + 1) for i in range(len(run) - 1))
    return poles, links


def apply_alley_poles(package, roads, surfaces, reserved_public):
    """Replace legacy layout poles only along newly served grade-one segments."""
    alley_roads = [shape(road['geometry']) for road in roads if road.get('grade') == 1]
    if not alley_roads:
        return
    centerlines = [
        line for line in S.get_parts(S.line_merge(unary_union(alley_roads)))
        if line.geom_type == 'LineString' and line.length >= MIN_SPAN
    ]
    if not centerlines:
        return
    plots = package['plots']['buildings']
    frontages = package.get('frontages', {}).get('buildings', {})
    buildings = unary_union([
        shape(frontages.get(str(building['id']), {}).get('renderBuilding') or building['building'])
        for building in plots
    ])
    allowed = unary_union([shape(building['plot']) for building in plots])
    road = unary_union([shape(geometry) for geometry in surfaces.values()])
    data = package['infill']
    details = data.get('siteDetails', {})
    obstacles = [buildings.buffer(.38), road]
    if reserved_public is not None:
        obstacles.append(reserved_public)
    obstacles.extend(shape(data[key]) for key in ('vehicleAccess', 'protectedAccess') if data.get(key))
    obstacles.extend(shape(g) for g in data.get('vehicleApproaches', []))
    obstacles.extend(shape(path['geometry']) for path in data.get('accessPaths', []))
    for row in [*data.get('bays', []), *data.get('entries', [])]:
        obstacles.extend(shape(row[key]) for key in ('footprint', 'connector', 'entrance', 'approach') if row.get(key))
    for row in [*data.get('walls', []), *data.get('gaps', []), *details.get('fences', []), *details.get('gates', [])]:
        if 'a' in row and 'b' in row:
            obstacles.append(LineString([row['a'], row['b']]).buffer(.16))
    poles, links = plan_poles(centerlines, road, buildings, unary_union(obstacles).buffer(.12), allowed)
    if not links:
        return
    spans = [LineString([poles[a]['point'], poles[b]['point']]) for a, b in links]
    area = unary_union(spans).buffer(6).intersection(unary_union(centerlines).buffer(4.8))
    old_indices = {}
    kept_poles = []
    for index, pole in enumerate(data.get('poles', [])):
        if not area.covers(Point(pole['point'])):
            old_indices[index] = len(kept_poles)
            kept_poles.append(pole)
    kept_links = [
        (old_indices[a], old_indices[b])
        for a, b in data.get('poleLinks', [])
        if a in old_indices and b in old_indices
    ]
    start = len(kept_poles)
    data['poles'] = kept_poles + poles
    data['poleLinks'] = kept_links + [(start + a, start + b) for a, b in links]
    data['grade1PoleArea'] = mapping(area)
    data['qa'].update(poles=len(data['poles']), wireSpans=len(data['poleLinks']), grade1Poles=len(poles), grade1Spans=len(links))
