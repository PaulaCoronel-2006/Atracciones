import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_docx(docx_path):
    try:
        doc = zipfile.ZipFile(docx_path)
        xml_content = doc.read('word/document.xml')
        doc.close()
        tree = ET.XML(xml_content)
        
        NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        TEXT = NAMESPACE + 't'
        
        text = []
        for node in tree.iter(TEXT):
            if node.text:
                text.append(node.text)
                
        return '\n'.join(text)
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    text = extract_text_from_docx("Requerimientos_Atracciones-IntegraciónDeSistemas (1).docx")
    with open("docx_output.txt", "w", encoding="utf-8") as f:
        f.write(text)
