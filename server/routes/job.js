/**
 * Created by pritish on 14-04-2016.
 */
module.exports = function (io) {
    var express = require('express');
    var router = express.Router();
    var Job = require('../models/job');
    var Comment = require('../models/comments');
    var Like = require('../models/likes');
    var Notification = require('../models/notifications');

    router.get('/', function (req, res) {
        Job.find({})
            .populate('user')
            .exec(function (err, jobs) {
                if (err) {
                    return res.json({error: err});
                }
                return res.json(jobs)
            });
    })

    router.post('/', function (req, res) {

        var job = new Job();
        job.duration = req.body.duration;
        job.person = req.body.person;
        job.description = req.body.description;
        job.price_min = req.body.price_min;
        job.price_max = req.body.price_max;
        job.locality = req.body.locality;
        job.begin = req.body.begin;
        job.city = req.body.city;
        job.service = req.body.service;
        job.user = req.user._id;
        job.save(function (err, job) {
            if (err) {
                return res.json(err)
            }
            job.user = req.user;
            io.emit('job', job);
            return res.json(job)
        })
    })

    router.get('/:id', function (req, res) {

        Job.findOne({_id: req.params.id})
            .populate('user')
            .exec(function (err, job) {
                if (err) {
                    return res.json(err);
                }
                return res.json(job);
            })
    })

    router.put('/:id', function (req, res) {

        Job.findOneAndUpdate({_id: req.params.id}, {duration: req.body.job},
            {person: req.body.job}, {description: req.body.job}, {price_min: req.body.job},
            {price_max: req.body.job}, {locality: req.body.job}, {begin: req.body.job}, {name: req.body.job},
            {name: req.body.job},
            function (err, job) {
                if (err) {
                    return res.json(err);
                }
                return res.json(job);
            })

    });
    router.delete('/:id', function (req, res) {

        Job.findOneAndRemove({_id: req.params.id}, function (err, job) {
            if (err) {
                return res.json(err);
            }
            return res.json(job);
        })

    });

    router.delete('/users/:id/likes/:lid', function (req, res) {

        Like.findOneAndRemove({_id: req.params.lid}, function (err, like) {
            if (err) {
                return res.json(err);
            }
            return res.json(like);
        })

    });



    router.get('/:id/comments', function (req, res) {
        Comment.find({job: req.params.id})
            .populate('user')

            .exec(function (err, comments) {
                if (err) {
                    return res.json({error: err});
                }
                return res.json(comments)
            });
    })

    router.post('/:id/comments', function (req, res, next) {

        if (!req.user) {
            res.json({error: 'Not signed in'});
        } else {

            var comment = new Comment();
            comment.body = req.body.comment;
            comment.user = req.user._id;
            comment.job = req.params.id;
            comment.save(function (err, comment) {
                if (err || !comment) {
                    console.log(err);
                    return res.json({error: 'comment not posted'});
                } else {
                    Job.findOne({_id: req.params.id}, function (err, job) {
                        if(err){
                            console.log(err);
                            return res.send({error: err});
                        }
                        var notification = new Notification();
                        notification.userfrom = req.user._id;
                        notification.job = req.params.id;
                        notification.userto = job.user;
                        if(notification.userfrom == notification.userto){
                            comment.user = req.user;
                            io.emit('comment', comment);
                            res.json(comment);
                        }
                        else{
                        notification.save(function (err, notification) {
                            if(err){
                                console.log(err);
                                return res.send({error: err});
                            }
                            comment.user = req.user;
                            notification.userfrom = req.user;
                            notification.job = job;
                            io.emit('comment', comment);
                            io.emit('notification', notification);
                            res.json(comment);
                        });
                        }
                    })
                }
            });
        }

    });


    router.get('/users/:id/likes', function (req, res) {
        Like.find({user: req.params.id})
            .populate('job user')

            .exec(function (err, likes) {
                if (err) {
                    return res.json({error: err});
                }
                return res.json(likes)
            });
    })

    router.post('/users/:id/likes', function (req, res) {

        if (!req.user) {
            res.json({error: 'Not signed in'});
        } else {

            var like = new Like();
            like.user = req.user._id;
            like.job = req.params.id;
            like.save(function (err, like) {
                if (err || !like) {
                    res.json({error: 'not liked'});
                } else {

                    res.json(like);
                }

            });


        }

    });


    //notifications for a user
    router.get('/users/:id/notifications', function (req, res) {
        Notification.find({userto: req.params.id})

             .populate('job userfrom userto')
            .exec(function (err, notifications) {
                if (err) {
                    return res.json({error: err});
                }
                return res.json(notifications)
            });
    })

    //delete a notification

    router.delete('/users/:id/notifications/:nId', function (req, res) {

        Notification.findOneAndRemove({_id: req.params.nId}, function (err, notification) {
            if (err) {
                return res.json(err);
            }
            return res.json(notification);
        })

    });


    //return all posted jobs by a user
    router.get('/users/:id/jobs', function (req, res) {

        Job.find({userto: req.params.id})
            .populate('user')
            .exec(function (err, jobs) {
                if (err) {
                    console.log(err);
                    return res.json({error: 'Error'});
                }
                res.json(jobs);
            });


    });

    return router;
}