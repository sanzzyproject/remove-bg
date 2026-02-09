const fs = require('fs');
const path = require('path');
const os = require('os');
const Busboy = require('busboy');
const FormData = require('form-data');
const axios = require('axios');

// --- KODE LOGIKA DARI USER (DIADAPTASI) ---
const headers = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
  'sec-ch-ua-mobile': '?1',
  'sec-ch-ua-platform': '"Android"',
  'Accept-Language': 'id-ID,id;q=0.9,en-AU;q=0.8,en;q=0.7,en-US;q=0.6'
};

async function getwebtoken() {
  try {
    const r = await axios.get('https://removal.ai/wp-admin/admin-ajax.php', {
      headers,
      params: { action: 'ajax_get_webtoken', security: '4acc8a2f93' }
    });
    return r.data.data.webtoken;
  } catch (e) {
    console.error("Token Error:", e.message);
    throw new Error("Gagal mengambil token keamanan.");
  }
}

async function removebg(img_path) {
  const webToken = await getwebtoken();
  const form = new FormData();
  
  form.append('image_file', fs.createReadStream(img_path), {
    filename: path.basename(img_path),
    contentType: 'image/jpeg'
  });

  const r = await axios.post('https://api.removal.ai/3.0/remove', form, {
    headers: {
      ...headers,
      ...form.getHeaders(),
      'Web-Token': webToken
    },
  });
  return r.data;
}
// --- AKHIR KODE LOGIKA USER ---

// --- HANDLER SERVERLESS VERCEL ---
module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const busboy = Busboy({ headers: req.headers });
  let uploadPath = '';

  busboy.on('file', (fieldname, file, info) => {
    const { filename } = info;
    // Simpan ke folder temporary OS (Wajib untuk Vercel Serverless)
    const saveTo = path.join(os.tmpdir(), `upload_${Date.now()}_${filename}`);
    uploadPath = saveTo;
    file.pipe(fs.createWriteStream(saveTo));
  });

  busboy.on('finish', async () => {
    try {
      if (!uploadPath) {
        return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
      }

      // Proses Remove BG
      const result = await removebg(uploadPath);

      // Hapus file temp setelah selesai
      fs.unlinkSync(uploadPath);

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memproses gambar.', details: error.message });
    }
  });

  req.pipe(busboy);
};
