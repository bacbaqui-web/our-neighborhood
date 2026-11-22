import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('publication_manifest', Path(__file__).resolve().parents[1] / 'scripts/publication_manifest.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class PublicationManifestTest(unittest.TestCase):
    def test_real_manifest(self):
        files = module.publication_files()
        self.assertFalse(any('/codex-bridge/' in p for p in files))
        self.assertIn('outputs/domestic-test/asset-encyclopedia/categories/house/korean-facades.js', files)

    def test_invalid_paths_and_missing_files(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'outputs').mkdir()
            (root / 'outputs/ok.js').write_text('')
            manifest = root / 'manifest.json'
            for files in [['outputs/ok.js', 'outputs/ok.js'], ['outputs/../secret'], ['/etc/passwd'], ['outputs/missing.js'], ['outputs/test.py'], ['outputs/.cache/a'], ['outputs//ok.js']]:
                manifest.write_text(json.dumps({'version': 1, 'files': files}))
                with self.subTest(files=files), self.assertRaises(ValueError):
                    module.publication_files(root, manifest)
            (root / 'outputs/link.js').symlink_to(root / 'outputs/ok.js')
            manifest.write_text(json.dumps({'version': 1, 'files': ['outputs/link.js']}))
            with self.assertRaisesRegex(ValueError, 'Symlink'):
                module.publication_files(root, manifest)
            manifest.write_text(json.dumps({'version': 1, 'files': ['outputs/ok.js']}))
            self.assertEqual(module.publication_files(root, manifest), ['outputs/ok.js'])
            # An unrelated new runtime/cache file never enters the reviewed list.
            (root / 'outputs/extra.js').write_text('')
            self.assertEqual(module.publication_files(root, manifest), ['outputs/ok.js'])

if __name__ == '__main__':
    unittest.main()
