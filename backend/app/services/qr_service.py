import qrcode
from io import BytesIO

def generate_qr_code(transaction_id):
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(f"nearbuy:{transaction_id}")
    qr.make(fit=True)
    img = qr.make_image(fill='black', back_color='white')
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()