module.exports.attach = function (express) {
    var router = express.Router();
    router.get('/s', function(req, res) {
        //if(req.params[0].indexOf(['/','/index']) == -1){
        //    res.redirect('index.html');
        //}
    });

   return router;
};