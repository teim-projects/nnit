import base64
import os

img_path = 'crm-project-backend/static/images/heder_opt.jpg'
if os.path.exists(img_path):
    with open(img_path, 'rb') as f:
        b64_str = base64.b64encode(f.read()).decode('utf-8')
    
    out_path = 'crm-project-frontend/src/utils/headerBase64.js'
    content = f'export const HEADER_IMAGE_BASE64 = "data:image/jpeg;base64,{b64_str}";\n'
    with open(out_path, 'w', encoding='utf-8') as out:
        out.write(content)
    print("Successfully generated headerBase64.js, size:", len(content))
else:
    print("Optimized image not found!")
