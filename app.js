const express = require('express')
const app = express()
const path = require('path')
const multer = require('multer')
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const fs = require('fs');

// use FilePost
// db.createUser({
//     user: "FilePost",
//     pwd: "DancingCodes1227",
//     roles: [{ role: "readWrite", db: "FilePost" }]
// })
mongoose.connect('mongodb://FilePost:DancingCodes1227@127.0.0.1:27017/FilePost').then(
    () => {
        console.log('数据库已连接')
    },
    err => {
        console.log('数据库连接失败')
    }
)
const uploadFileSchema = new mongoose.Schema({
    fileUrl: {
        type: String,
        required: true
    },
    createTime: {
        type: String,
        default: () => dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
})
const UploadFile = mongoose.model('UploadFile', uploadFileSchema);


const config = {
    network: 'http://127.0.0.1',
    port: 3001
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
})


app.use('/uploadFiles', express.static('uploadFiles'));
const uploadDir = 'uploadFiles/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.post('/uploadFile', (req, res) => {
    // 设置文件大小限制为 10MB
    const fileSizeLimit = 10 * 1024 * 1024;
    const uploadMulter = multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, uploadDir);
            },
            filename: async (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                cb(null, uniqueSuffix + ext);
            }
        }),

        limits: { fileSize: fileSizeLimit },
    }).single('file');

    uploadMulter(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                // 文件上传错误处理
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.send({
                        code: 500,
                        msg: `文件大小超出限制，最大支持${fileSizeLimit / 1024 / 1024}MB`
                    });
                } else {
                    res.send({
                        code: 500,
                        msg: '服务器内部错误！'
                    })
                }
            }
        }

        if (req.file) {
            const { mimetype, filename } = req.file
            const fileUrl = `${config.network}:${config.port}/uploadFiles/${filename}`

            await new UploadFile({ fileUrl }).save()
            res.send({
                code: 200,
                data: {
                    mimetype,
                    fileUrl
                },
                msg: '上传成功！'
            })
        } else {
            res.send({
                code: 500,
                msg: '没有文件上传！'
            })
        }
    })
})

app.listen(config.port, () => {
    console.log(`File-Store: ${config.network}:${config.port}`);
})