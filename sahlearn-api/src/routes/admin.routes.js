const router = require('express').Router();
const coursesCtrl = require('../controllers/courses.controller');
const postsCtrl = require('../controllers/posts.controller');
const { getStats } = require('../controllers/stats.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/courses', coursesCtrl.adminList);
router.get('/courses/:id', coursesCtrl.adminGetById);
router.get('/posts', postsCtrl.adminList);
router.get('/posts/:id', postsCtrl.adminGetById);

module.exports = router;
