var express = require('express')
var passport = require('passport')
var router = express.Router()

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource')
})

router.get('/moo', function(req, res, next) {
  res.send('moo!!')
})

module.exports = router
