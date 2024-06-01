require('dotenv').config(); // 加载环境变量

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');
var https = require('https');
var helmet = require('helmet');

var app = express();

// 设置视图引擎（如果使用的话）
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// 使用中间件
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());

// 示例路由
app.get('/', (req, res) => {
  res.send('Hello, HTTPS!');
});

// 捕获404并转发到错误处理程序
app.use(function(req, res, next) {
  next(createError(404));
});

// 错误处理程序
app.use(function(err, req, res, next) {
  // 设置本地变量，只在开发中提供错误信息
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 渲染错误页面
  res.status(err.status || 500);
  res.render('error');
});

// 读取SSL证书和私钥
const privateKey = fs.readFileSync(path.join(__dirname, 'sslcert', 'server.key'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'sslcert', 'server.cert'), 'utf8');

const credentials = { key: privateKey, cert: certificate };

// 创建HTTPS服务器
const server = https.createServer(credentials, app);

const apiKey = process.env.API_KEY;
console.log(`Your API Key is: ${apiKey}`);

const port = process.env.PORT || 3005;
server.listen(port, () => {
  console.log(`HTTPS server running on port ${port}`);
});

server.on('error', onError);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

module.exports = app;
