const Busboy = require('busboy');
const FormData = require('form-data');
const axios = require('axios');

// Konfigurasi agar Vercel TIDAK mengacak-acak file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

const headers = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
};

async function getwebtoken() {
  try {
    const r = await axios.get('https://removal.ai/wp-admin/admin-ajax.php', {
      headers,
      params: { action: 'ajax_get_webtoken', security: '4acc8a2f93' }
    });
    return r.data.data.webtoken;
  } catch (e) {
    throw new Error("Gagal mengambil token keamanan: " + e.message);
  }
}

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const busboy = Busboy({ headers: req.headers });
  let fileBuffer = null;
  let fileName = '';

  busboy.on('file', (fieldname, file, info) => {
    const chunks = [];
    fileName = info.filename;
    file.on('data', (data) => chunks.push(data));
    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks);
    });
  });

  busboy.on('finish', async () => {
    try {
      if (!fileBuffer) return res.status(400).json({ error: 'Tidak ada file gambar.' });

      // 1. Get Token
      const webToken = await getwebtoken();

      // 2. Prepare Form Data
      const form = new FormData();
      form.append('image_file', fileBuffer, {
        filename: fileName || 'image.jpg',
        contentType: 'image/jpeg'
      });

      // 3. Request ke Removal AI
      const r = await axios.post('https://api.removal.ai/3.0/remove', form, {
        headers: {
          ...headers,
          ...form.getHeaders(),
          'Web-Token': webToken
        },
      });

      res.status(200).json(r.data);

    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        error: 'Gagal memproses gambar.', 
        details: error.response ? error.response.data : error.message 
      });
    }
  });

  req.pipe(busboy);
};
