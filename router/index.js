var express = require('express');
var router = express.Router();
const pool = require("../src/sql.js");
const path = require("path");
const multer = require('multer');
const fs = require('fs');
//新增使用者資訊到login table
router.post('/login', (req, res) => {

  console.log(req.body);

  //資料庫註冊
  pool.query(`insert into login (fname, lname, email, password) values ('${req.body.fname}','${req.body.lname}','${req.body.email}','${req.body.password}');`)
  res.send(200);
});

//登入資料核對
router.post('/signin', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log(req.body);
  const query = 'SELECT * FROM login WHERE email = ?';

  pool.query(query, [email], (err, results) => {
    if (err) {
      console.error(err);
      // 處理錯誤
      return;
    }

    // results 包含查詢結果的陣列
    const rows = results[0];
    console.log(rows);
    console.log(rows.email);

    if (rows.email === email && rows.password === password) { //驗證前端傳到後端的帳號密碼是否有存在於資料庫
      // 找到符合條件的使用者
      console.log('User found:', rows.fname + rows.lname);
      res.send("Success" + rows.fname + rows.lname);

    } else {
      // 沒有符合條件的使用者
      console.log('User not found');
      res.send("errr");
    }
  });
}
);

//將創建資料夾的資訊存入資料庫
router.post('/WCreateFolder', (req, res) => {
  console.log(req.body)

  if (req.body.token.includes("Success")) {
    const user = req.body.token.slice(7);//取得Success後面的字串 slice(輸入取用的第幾位之後)
    console.log(user)
    pool.query(`insert into CreateFolder (user, folder_name, uploadtime) values ('${user}','${req.body.data.folder_name}','${String(req.body.data.uploadtime)}');`)
    return res.sendStatus(200);
  }
  res.sendStatus(403);
});

//創建使用者上傳檔案之資料夾
router.post('/CreateFolder', (req, res) => {
  const folderName = req.body.data.folder_name
  console.log("test")
  console.log(req.body)
  // 動態生成資料夾路徑
  const folderPath = path.join(__dirname, '..', 'UserUploadFolder', folderName);

  // 如果資料夾不存在，則建立
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(folderName)
    return res.send('Success' + folderName);
  }

  res.send('fail   ');
});

//刪除使用者上傳檔案之資料夾(還沒用到)
router.delete('/DeleteFolder/:folder_name', (req, res) => {

  const folderName = req.params.folder_name;

  pool.query(`DELETE FROM Project WHERE folder = '${folderName}'`, (err, result) => {
    if (err) {
      console.error('Error deleting database record:', err);
      return res.status(500).send('Error deleting database record');
    }
  })

  pool.query(`DELETE FROM CreateFolder WHERE folder_name = '${folderName}'`, (err, result) => {
    if (err) {
      console.error('Error deleting database record:', err);
      return res.status(500).send('Error deleting database record');
    }
  })

  // 動態生成資料夾路徑
  const folderPath = path.join(__dirname, '..', 'UserUploadFolder', folderName);


  if (fs.existsSync(folderPath)) {
    // 使用 fs.rmdirSync 刪除資料夾
    fs.rmdirSync(folderPath, { recursive: true });

    return res.send('Success');
  }

  res.send("can't find");
});

//使用者上傳檔案至後端及資料庫
router.post('/upload', (req, res) => {

  const user = req.body.data.user
  const folder = req.body.data.folder
  const project_name = req.body.data.project_name
  const project_data = req.body.data.project_data
  const upload_time = req.body.data.upload_time

  pool.query(`insert into Project (user, folder, project_name, project_data, upload_time) values ('${user}', '${folder}', '${project_name}', '${project_data}', '${String(upload_time)}');`)
  res.sendStatus(200);

  const folderPath = path.join(__dirname, '../UserUploadFolder', folder);
  const imagePath = path.join(folderPath, project_name[0]);
  const base64Data = project_data[0].replace(/^data:image\/jpeg;base64,/, "");
  fs.writeFileSync(imagePath, base64Data, 'base64');

});


//獲取有哪些資料夾
router.get('/WCreateFolder', (req, res) => {
  // SQL 查詢語句，檢索所需的列
  const query = 'SELECT id, folder_name FROM CreateFolder';

  // 執行 SQL 查詢
  pool.query(query, (error, results, fields) => {
    if (error) {
      console.error('Error executing query: ', error);
      res.status(500).json({ error: 'An error occurred while fetching data' });
      return;
    }

    // 將檢索到的資料返回給前端
    res.json(results);
  });
});

//requirement
router.post('/Requirement', (req, res) => {

  const user = req.body.inform.Username
  const time = req.body.inform.uploadtime
  const jsonData = JSON.stringify(req.body.data, null, 2);


  const fileName = 'requirement.json'
  //const filePath = path.join(__dirname, '../UserUploadFolder', fileName); //
  const filePath = `${__dirname}/../UserUploadFolder/${req.body.inform.folder_name}/${fileName}`;

  console.log(jsonData)

  fs.writeFile(filePath, jsonData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing JSON file:', err);
    } else {
      console.log('JSON file saved successfully!');
      console.log(req.body.inform);
    }
  });
  pool.query(`insert into Requirement (requirement_path, author, uploadtime) values ('${filePath}', '${user}', '${String(time)}');`)
});

//抓取圖片
router.get('/Download', (req, res) => {

});
module.exports = router;
