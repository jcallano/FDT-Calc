import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import html2text

def clean_and_convert_to_markdown(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
        element.extract()
    
    h2t = html2text.HTML2Text()
    h2t.ignore_links = False
    h2t.ignore_images = False
    h2t.body_width = 0
    return h2t.handle(str(soup))

def main():
    print("Conectando al navegador Chrome existente...")
    options = Options()
    options.debugger_address = "127.0.0.1:9222"
    
    try:
        driver = webdriver.Chrome(options=options)
    except Exception as e:
        print(f"Error al conectar con Chrome: {e}")
        return
        
    print("\n¡Conexión exitosa a tu sesión actual de Chrome!")
    print("Iniciando extracción dinámica...")
    
    output_file = "manual_completo_dinamico.md"
    if os.path.exists(output_file):
        os.remove(output_file)
        
    visited_hrefs = set()
    page_count = 0
    
    while True:
        # Volver a buscar todos los elementos de la tabla de contenido, ya que el DOM puede haber cambiado
        toc_nodes = driver.find_elements("css selector", "a.ftd-toc-node")
        
        # Buscar el primero que no hayamos visitado
        next_node = None
        for node in toc_nodes:
            try:
                href = node.get_attribute("href")
                if href and href not in visited_hrefs:
                    next_node = node
                    break
            except Exception:
                # El elemento podría haberse vuelto obsoleto (stale) mientras iterábamos
                continue
                
        if not next_node:
            print("\n¡Ya no hay más numerales nuevos por visitar! Extracción finalizada.")
            break
            
        try:
            # Obtener datos del nodo para el registro
            href = next_node.get_attribute("href")
            text_desc = next_node.text.strip().replace('\n', ' ')[:50]
            
            print(f"[{page_count + 1}] Haciendo clic y extrayendo: {text_desc}")
            
            # Hacer clic usando JS por si algún otro elemento lo tapa
            driver.execute_script("arguments[0].click();", next_node)
            visited_hrefs.add(href)
            
            # Esperar a que cargue el contenido derecho y posibles hijos en la izquierda
            time.sleep(3)
            
            # Buscar el contenedor del panel derecho (normalmente el contenedor principal de lectura)
            # Heurística: buscaremos el elemento que no sea la navegación izquierda que tenga más texto
            page_source = driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # Eliminar el menú izquierdo del HTML para no extraerlo
            nav_element = soup.find('ul', class_='tde-tree-level')
            if nav_element:
                nav_element.extract()
            
            # Otra heurística si la anterior falla: a veces el contenido está en un div con id 'content' o similar
            content_area = soup.find(id='document-content') or soup.find('article') or soup.find('main') or soup
            
            markdown_content = clean_and_convert_to_markdown(str(content_area))
            
            with open(output_file, "a", encoding="utf-8") as f:
                if page_count > 0:
                    f.write("\n\n---\n\n")
                f.write(f"## {text_desc}\n\n")
                f.write(markdown_content)
                
            page_count += 1
            print(f"    -> Guardado.")
            
        except Exception as e:
            print(f"    -> Error procesando nodo: {e}")
            # Si hubo error, marcamos como visitado de todos modos para no entrar en bucle infinito
            if 'href' in locals() and href:
                visited_hrefs.add(href)
                
    print(f"\nProceso finalizado. Total guardado: {page_count} secciones.")
    print(f"Archivo generado: {os.path.abspath(output_file)}")

if __name__ == "__main__":
    main()
