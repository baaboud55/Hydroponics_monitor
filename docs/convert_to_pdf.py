#!/usr/bin/env python3
"""
Convert Markdown to PDF with Arabic support
"""
import markdown
from weasyprint import HTML, CSS
from pathlib import Path
import sys

def convert_md_to_pdf(md_file, pdf_file):
    """Convert markdown file to PDF with Arabic support"""
    
    # Read markdown content
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert markdown to HTML
    html_content = markdown.markdown(
        md_content,
        extensions=['tables', 'fenced_code', 'codehilite', 'nl2br']
    )
    
    # Add HTML wrapper with RTL support for Arabic
    html_template = f"""
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير المشروع - نظام الزراعة المائية</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
            
            body {{
                font-family: 'Noto Sans Arabic', Arial, sans-serif;
                direction: rtl;
                text-align: right;
                line-height: 1.8;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
                color: #333;
            }}
            
            h1 {{
                color: #2c5f2d;
                border-bottom: 3px solid #97bc62;
                padding-bottom: 10px;
                margin-top: 30px;
            }}
            
            h2 {{
                color: #2c5f2d;
                border-bottom: 2px solid #d4e5c7;
                padding-bottom: 8px;
                margin-top: 25px;
            }}
            
            h3 {{
                color: #4a7c4e;
                margin-top: 20px;
            }}
            
            table {{
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
                direction: rtl;
            }}
            
            th, td {{
                border: 1px solid #ddd;
                padding: 12px;
                text-align: right;
            }}
            
            th {{
                background-color: #2c5f2d;
                color: white;
                font-weight: bold;
            }}
            
            tr:nth-child(even) {{
                background-color: #f9f9f9;
            }}
            
            code {{
                background-color: #f5f5f5;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                direction: ltr;
                display: inline-block;
            }}
            
            pre {{
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
                direction: ltr;
            }}
            
            ul, ol {{
                margin: 15px 0;
                padding-right: 30px;
            }}
            
            li {{
                margin: 8px 0;
            }}
            
            blockquote {{
                border-right: 4px solid #2c5f2d;
                padding: 10px 20px;
                margin: 20px 0;
                background-color: #f0f7f0;
            }}
            
            hr {{
                border: none;
                border-top: 2px solid #d4e5c7;
                margin: 30px 0;
            }}
            
            a {{
                color: #2c5f2d;
                text-decoration: none;
            }}
            
            a:hover {{
                text-decoration: underline;
            }}
            
            @page {{
                margin: 2cm;
            }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    # Convert HTML to PDF
    HTML(string=html_template).write_pdf(pdf_file)
    print(f"✅ تم التحويل بنجاح: {pdf_file}")

if __name__ == "__main__":
    md_file = "d:/Github/HydroMonitor/docs/project_report_ar.md"
    pdf_file = "d:/Github/HydroMonitor/docs/project_report_ar.pdf"
    
    try:
        convert_md_to_pdf(md_file, pdf_file)
    except Exception as e:
        print(f"❌ خطأ: {e}")
        sys.exit(1)
