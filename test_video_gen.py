import unittest
from unittest.mock import patch, MagicMock
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from video_generator import generate_transformation_video

class TestVideoGenerator(unittest.TestCase):
    @patch('video_generator.requests.post')
    @patch('video_generator.API_KEY', 'test_key')
    def test_generate_transformation_video(self, mock_post):
        # Setup mock response
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_response.json.return_value = {"id": "test_job_id"}
        mock_post.return_value = mock_response

        # Test data
        original_img = "base64_original"
        redesign_img = "base64_redesign"
        
        # Call function (we mock poll_video_status to avoid waiting)
        with patch('video_generator.poll_video_status') as mock_poll:
            mock_poll.return_value = {"status": "completed", "video_url": "http://example.com/video.mp4"}
            
            result = generate_transformation_video(original_img, redesign_img)
            
            # Verify result
            self.assertEqual(result['status'], 'completed')
            self.assertEqual(result['video_url'], 'http://example.com/video.mp4')
            
            # Verify API call payload
            args, kwargs = mock_post.call_args
            payload = kwargs['json']
            
            # Check if prompt contains the new text
            self.assertIn("Transformation from original yard", payload['prompt'])
            # Check if image_url is the redesign image
            self.assertEqual(payload['image_url'], redesign_img)
            # Check motion parameters
            self.assertEqual(payload['motion']['type'], 'camera_rotation')

if __name__ == '__main__':
    unittest.main()
