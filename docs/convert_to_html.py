#!/usr/bin/env python3
"""
Convert Markdown to HTML for PDF conversion via browser
"""
import markdown
from pathlib import Path

def convert_md_to_html(md_file, html_file):
    """Convert markdown file to HTML with Arabic support"""
    
    # Read markdown content
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert markdown to HTML
    html_content = markdown.markdown(
        md_content,
        extensions=['tables', 'fenced_code', 'nl2br', 'sane_lists']
    )
    
    # Add HTML wrapper with RTL support for Arabic
    html_template = """<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير المشروع - نظام الزراعة المائية</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.8;
            padding: 60px 80px;
            max-width: 1000px;
            margin: 0 auto;
            color: #333;
            background: white;
        }
        
        h1 {
            color: #2c5f2d;
            border-bottom: 4px solid #97bc62;
            padding-bottom: 15px;
            margin: 40px 0 25px 0;
            font-size: 2.2em;
            page-break-after: avoid;
        }
        
        h2 {
            color: #2c5f2d;
            border-bottom: 2px solid #d4e5c7;
            padding-bottom: 10px;
            margin: 35px 0 20px 0;
            font-size: 1.8em;
            page-break-after: avoid;
        }
        
        h3 {
            color: #4a7c4e;
            margin: 25px 0 15px 0;
            font-size: 1.4em;
            page-break-after: avoid;
        }
        
        p {
            margin: 12px 0;
            text-align: justify;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 25px 0;
            direction: rtl;
            page-break-inside: avoid;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 14px 16px;
            text-align: right;
        }
        
        th {
            background-color: #2c5f2d;
            color: white;
            font-weight: bold;
            font-size: 1.05em;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        tr:hover {
            background-color: #f0f7f0;
        }
        
        code {
            background-color: #f5f5f5;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'Courier Prime', 'Courier New', monospace;
            direction: ltr;
            display: inline-block;
            font-size: 0.9em;
            color: #c7254e;
            border: 1px solid #e1e1e8;
        }
        
        pre {
            background-color: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            direction: ltr;
            border: 1px solid #e1e1e8;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        
        pre code {
            background: none;
            padding: 0;
            border: none;
            color: #333;
        }
        
        ul, ol {
            margin: 18px 0;
            padding-right: 35px;
        }
        
        li {
            margin: 10px 0;
            line-height: 1.6;
        }
        
        blockquote {
            border-right: 5px solid #2c5f2d;
            padding: 15px 25px;
            margin: 25px 0;
            background-color: #f0f7f0;
            border-radius: 5px;
            page-break-inside: avoid;
        }
        
        blockquote p {
            margin: 8px 0;
        }
        
        hr {
            border: none;
            border-top: 3px solid #d4e5c7;
            margin: 40px 0;
        }
        
        a {
            color: #2c5f2d;
            text-decoration: none;
            border-bottom: 1px dotted #2c5f2d;
        }
        
        a:hover {
            border-bottom: 1px solid #2c5f2d;
        }
        
        /* Print styles */
        @media print {
            body {
                padding: 40px;
            }
            
            @page {
                margin: 2cm;
                size: A4;
            }
            
            h1, h2, h3 {
                page-break-after: avoid;
            }
            
            table, figure, img {
                page-break-inside: avoid;
            }
        }
        
        /* RTL specific fixes */
        [dir="ltr"] {
            text-align: left;
            direction: ltr;
        }
        
        /* Emoji support */
        .emoji {
            font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
        }
    </style>
</head>
<body>
""" + html_content + """
<hr>
<p style="text-align: center; color: #888; font-size: 0.9em; margin-top: 40px;">
    تم إنشاء هذا التقرير باستخدام نظام HydroMonitor
</p>
</body>
</html>"""
    
    # Write HTML file
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_template)
    
    print(f"✅ تم إنشاء ملف HTML: {html_file}")
    print(f"")
    print(f"📄 لتحويله إلى PDF:")
    print(f"   1. افتح الملف في المتصفح")
    print(f"   2. اضغط Ctrl+P للطباعة")
    print(f"   3. اختر 'Save as PDF' أو 'حفظ كـ PDF'")
    print(f"   4. احفظ الملف")

if __name__ == "__main__":
    md_file = "d:/Github/HydroMonitor/docs/project_report_ar.md"
    html_file = "d:/Github/HydroMonitor/docs/project_report_ar.html"
    
    try:
        convert_md_to_html(md_file, html_file)
    except Exception as e:
        print(f"❌ خطأ: {e}")
        import traceback
        traceback.print_exc()
