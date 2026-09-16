import os
import smtplib
import urllib.request
import tempfile
from email.message import EmailMessage
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Cargar claves privadas desde .envprivado
env_path = os.path.join(os.path.dirname(__file__), '.envprivado')
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)

import time
import webbrowser
from io import BytesIO
from PIL import Image
import pyautogui
import pyperclip
import win32clipboard
import win32gui
import win32con

app = Flask(__name__)
CORS(app)


@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify({
        "telegram_bot_token": os.getenv("TELEGRAM_BOT_TOKEN", ""),
        "telegram_chat_id": os.getenv("TELEGRAM_CHAT_ID", ""),
        "meta_access_token": os.getenv("META_ACCESS_TOKEN", ""),
        "instagram_user_id": os.getenv("INSTAGRAM_USER_ID", ""),
        "facebook_page_id": os.getenv("FACEBOOK_PAGE_ID", "")
    })


def post_to_x_pyautogui(image_data, text):
    try:
        # 1. Convertir la imagen y copiarla al portapapeles
        print("Preparando imagen para copiar al portapapeles...")
        image = Image.open(BytesIO(image_data))
        output = BytesIO()
        image.convert("RGB").save(output, "BMP")
        dib_data = output.getvalue()[14:]  # BMP header is 14 bytes, CF_DIB needs only the raw DIB data
        output.close()

        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(win32clipboard.CF_DIB, dib_data)
        win32clipboard.CloseClipboard()
        print("Imagen copiada al portapapeles.")

        # 2. Abrir la página de composición de X
        url_x = "https://x.com/compose/post"
        print(f"Abriendo X: {url_x}")
        webbrowser.open(url_x)

        # 3. Esperar a que la página cargue por completo
        print("Esperando 15 segundos para la carga de la página...")
        time.sleep(15)

        # 4. Copiar texto al portapapeles y pegarlo
        print("Pegan el texto en la caja de post...")
        pyperclip.copy(text)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(1)

        # 5. Volver a copiar la imagen (por si se sobreescribió en el portapapeles) y pegarla
        print("Pegan la imagen en la caja de post...")
        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(win32clipboard.CF_DIB, dib_data)
        win32clipboard.CloseClipboard()
        
        pyautogui.hotkey('ctrl', 'v')
        
        # 6. Esperar a que se procese la imagen
        print("Esperando 20 segundos para que la imagen se suba...")
        time.sleep(20)

        # 7. Publicar con Ctrl+Enter
        print("Enviando publicación (Ctrl+Enter)...")
        pyautogui.hotkey('ctrl', 'enter')

        # 8. Esperar a que se publique
        print("Esperando 20 segundos para que se publique...")
        time.sleep(20)

        # 9. Cerrar pestaña activa (Ctrl+W)
        print("Cerrando la pestaña (Ctrl+W)...")
        pyautogui.hotkey('ctrl', 'w')
        
        # Opcional: Esperar un momento corto y presionar 'enter' para confirmar 
        # en caso de que aún aparezca el aviso "quiere salir del sitio web"
        time.sleep(1)
        pyautogui.press('enter')
        
        print("Publicación completada con éxito.")
        return True

    except Exception as e:
        print(f"Error en post_to_x_pyautogui: {e}")
        raise e


@app.route('/api/x', methods=['POST'])
def post_to_x():
    try:
        data = request.json
        image_url = data.get('image_url')
        text = data.get('text')

        if not image_url or not text:
            return jsonify({"error": "Faltan datos requeridos (image_url, text)"}), 400

        # Descargar la imagen
        req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            image_data = response.read()

        # Ejecutar la publicación síncrona con PyAutoGUI
        post_to_x_pyautogui(image_data, text)

        return jsonify({"status": "success", "message": "Tweet publicado exitosamente"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def focus_browser():
    print("Buscando ventana del navegador para enfocar...")
    target_hwnd = [None]
    all_titles = []
    
    def callback(hwnd, extra):
        title = win32gui.GetWindowText(hwnd)
        if title:
            all_titles.append(title)
        title_lower = title.lower()
        keywords = ["linkedin", "chrome", "edge", "firefox", "brave", "opera"]
        if any(kw in title_lower for kw in keywords):
            target_hwnd[0] = hwnd
            return False
        return True

    try:
        win32gui.EnumWindows(callback, None)
        hwnd = target_hwnd[0]
        if hwnd:
            # Maximizar ventana para asegurar coordenadas consistentes
            win32gui.ShowWindow(hwnd, win32con.SW_MAXIMIZE)
            
            # Intentar traer al frente
            try:
                win32gui.SetForegroundWindow(hwnd)
                print(f"Ventana enfocada exitosamente: {win32gui.GetWindowText(hwnd)}")
            except Exception as e:
                print(f"Advertencia SetForegroundWindow: {e}. Intentando clic de activación...")
                # Simular clic en el área superior para forzar enfoque
                width, height = pyautogui.size()
                pyautogui.click(width // 2, 50)
                time.sleep(0.5)
                win32gui.SetForegroundWindow(hwnd)
            return hwnd
        else:
            print("No se encontró ventana activa del navegador.")
            print("Ventanas detectadas:")
            for t in all_titles[:20]:
                print(f" - {t}")
            return None
    except Exception as e:
        print(f"Error enfocando navegador: {e}")
        return None


def post_to_linkedin_pyautogui(image_data, text=None):
    temp_img_path = None
    try:
        # a) Guardar la imagen en un archivo temporal que luego sera eliminado
        print("Guardando imagen en archivo temporal...")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            temp_file.write(image_data)
            temp_img_path = os.path.abspath(temp_file.name)
        print(f"Imagen temporal guardada en: {temp_img_path}")

        # b) Abrir el link https://www.linkedin.com/sharing/compose y esperar 50 segundos
        url_linkedin = "https://www.linkedin.com/sharing/compose"
        print(f"Abriendo LinkedIn: {url_linkedin}")
        webbrowser.open(url_linkedin)
        print("Esperando 50 segundos para que cargue LinkedIn...")
        time.sleep(50)

        # Asegurar enfoque del navegador
        focus_browser()
        time.sleep(0.5)

        # c) Presionar 7 veces la tecla tab, presionar la tecla enter y esperar 20 segundos
        print("Presionando 7 veces tab y enter...")
        for _ in range(7):
            pyautogui.press('tab')
            time.sleep(0.2)
        pyautogui.press('enter')
        print("Esperando 20 segundos...")
        time.sleep(20)

        # d) Pegar la ruta del archivo temporal, presionar enter y esperar 30 segundos
        print(f"Pegando ruta del archivo temporal ({temp_img_path})...")
        time.sleep(1.5)  # Breve pausa para asegurar que el diálogo de archivos de Windows esté listo
        pyperclip.copy(temp_img_path)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.5)
        pyautogui.press('enter')
        print("Esperando 30 segundos tras cargar la imagen...")
        time.sleep(30)

        # e) Presionar 10 veces la tecla tab, presionar tecla enter y esperar 20 segundos
        focus_browser()
        time.sleep(0.5)
        print("Presionando 10 veces tab y enter...")
        for _ in range(10):
            pyautogui.press('tab')
            time.sleep(0.2)
        pyautogui.press('enter')
        print("Esperando 20 segundos...")
        time.sleep(20)

        # f) Presionar 16 veces la tecla tab, presionar tecla enter y esperar 20 segundos
        focus_browser()
        time.sleep(0.5)
        print("Presionando 16 veces tab y enter...")
        for _ in range(16):
            pyautogui.press('tab')
            time.sleep(0.2)
        pyautogui.press('enter')
        print("Esperando 20 segundos tras publicar...")
        time.sleep(20)

        # g) Esperar 20 segundos
        print("Esperando 20 segundos adicionales...")
        time.sleep(20)

        # h) Cerrar pestaña
        print("Cerrando la pestaña (Ctrl+W)...")
        focus_browser()
        time.sleep(0.5)
        pyautogui.hotkey('ctrl', 'w')
        time.sleep(1.0)

        print("Publicación en LinkedIn completada con éxito.")
        return True

    except Exception as e:
        print(f"Error en post_to_linkedin_pyautogui: {e}")
        raise e
    finally:
        # Eliminar el archivo temporal
        if temp_img_path and os.path.exists(temp_img_path):
            try:
                os.remove(temp_img_path)
                print(f"Archivo temporal eliminado: {temp_img_path}")
            except Exception as err:
                print(f"No se pudo eliminar el archivo temporal: {err}")


@app.route('/api/linkedin', methods=['POST'])
def post_to_linkedin():
    try:
        data = request.json
        image_url = data.get('image_url')
        text = data.get('text')

        if not image_url:
            return jsonify({"error": "Falta el dato requerido (image_url)"}), 400

        # Descargar la imagen
        req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            image_data = response.read()

        # Ejecutar la publicación síncrona con PyAutoGUI
        post_to_linkedin_pyautogui(image_data, text)

        return jsonify({"status": "success", "message": "Imagen y texto publicados exitosamente en LinkedIn"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("Iniciando Servidor Backend de AutoPublish...")
    print("Escuchando en http://127.0.0.1:5000")
    app.run(port=5000, debug=False)
