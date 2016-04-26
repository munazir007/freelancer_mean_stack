var app = angular.module('myApp', ['ngResource', 'ngRoute']);

app.factory('socket', function ($rootScope) {
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});


app.factory('Job', function ($resource) {
        return $resource('/api/jobs/:jobid', null, {
            'update': {method: 'PUT'}
        });
    }
);

app.factory('UserJob', function ($resource) {
        return $resource('/api/jobs/users/:userId/jobs', null, {
            'update': {method: 'PUT'}
        });
    }
);

app.factory('MarkedJob', function ($resource) {
        return $resource('/api/jobs/users/:userId/likes/:lid', null, {
            'update': {method: 'PUT'}
        });
    }
);

app.factory('Notification', function ($resource) {
        return $resource('/api/jobs/users/:userId/notifications/:nId', null, {
            'update': {method: 'PUT'}
        });
    }
);

app.factory('Comment', function ($resource) {
        return $resource('/api/jobs/:jid/comments', null, {
            'update': {method: 'PUT'}
        });
    }
);

app.factory('Like', function ($resource) {
        return $resource('/api/jobs/users/:jid/likes/:id', null, {
            'update': {method: 'PUT'}
        });
    }
);


app.controller('JobController', function ($scope, $rootScope, $http, socket, $routeParams, Job, Comment, Notification) {
    $scope.jobObject = {};
    if ($routeParams.jobid) {
        $scope.jobSingle = Job.get({jobid: $routeParams.jobid});
        $scope.comments = Comment.query({jid: $routeParams.jobid});

    }
    $scope.postJob = function () {
        var newJob = new Job();
        newJob.begin = $scope.jobObject.begin;
        newJob.city = $scope.jobObject.city;
        newJob.description = $scope.jobObject.description;
        newJob.duration = $scope.jobObject.duration;
        newJob.locality = $scope.jobObject.locality;
        newJob.person = $scope.jobObject.person;
        newJob.price_max = $scope.jobObject.price_max;
        newJob.price_min = $scope.jobObject.price_min;
        newJob.service = $scope.jobObject.service;


        newJob.$save(function (job) {
                console.log(job);
                if (!job.error) {
                    window.location = '/'
                }
            },
            function (err) {
                console.log(err);
            })
    }

    socket.on('comment', function (comment) {
        $scope.comments.push(comment);
    });


    // Moment js
    $rootScope.timeInWords = function (date) {
        return moment(date).fromNow();
    };

    $scope.postComment = function () {
        var newComment = new Comment();

        newComment.comment = $scope.commentBody;
        newComment.$save({jid: $routeParams.jobid}, function (comment) {
            console.log(comment);
            if (!comment.error) {
                $scope.commentBody = '';
                $scope.comments.unshift(comment)
            }
        });


    }

});

app.controller('UserJobController', function ($scope, $rootScope, socket, $http, $routeParams, UserJob) {
    $scope.jobs = UserJob.query({userId: $routeParams.userId});


});


app.controller('MarkJobController', function ($scope, $rootScope, socket, $http, $routeParams, MarkedJob) {
    $scope.marks = MarkedJob.query({userId: $routeParams.userId});

    $rootScope.timeInWords = function (date) {
        return moment(date).fromNow();
    };
});

app.controller('ViewController', function ($scope, $routeParams, $rootScope,  $http, Job, socket, Like, Notification) {
    $scope.jobs = Job.query();


    $http.get('/api/users/cuser')
        .success(function (currentUser) {
            $rootScope.currentUser = currentUser;
            console.log(currentUser);
            $rootScope.notifications = Notification.query({userId: $rootScope.currentUser._id}, function (data) {
                console.log(data);
            }, function (err) {
                console.log(err);
            });

            $rootScope.checkNoti = function (notId, index) {
                Notification.remove({nId: notId, userId: $rootScope.currentUser._id}, function (notification, err) {
                    if(notification.error){
                        console.log(err);
                    }
                    $scope.notifications.splice(index, 1);
                });

            };


            $rootScope.delJob = function (jobId, index) {
                Job.remove({jobid: jobId}, function (job, err) {
                    if(job.error){
                        console.log(err);
                    }
                    $scope.jobs.splice(index, 1);
                });



            };


        });


    // Moment js
    $scope.timeInWords = function (date) {
        return moment(date).fromNow();
    };

    socket.on('notification', function (notification) {
        $scope.notifications.push(notification);
    });

    socket.on('job', function (job) {
        $scope.jobs.push(job);
    });

    $rootScope.postLike = function (jobid) {

        var newLike = new Like();
        newLike.$save({jid: jobid}, function (like) {
            console.log(like);
            if (!like.error) {


            }
        });
    }

});


app.config(function ($routeProvider, $locationProvider) {
    $routeProvider

        .when('/home', {
            templateUrl: '/html/home.html',
            controller: 'ViewController'
        })
        .when('/postjob', {
            templateUrl: '/html/demo.html',
            controller: 'JobController'
        })
        .when('/jobs/:jobid', {
            templateUrl: '/html/job_single.html',
            controller: 'JobController'
        })
        .when('/user/:userId/jobs', {
            templateUrl: '/html/view.html',
            controller: 'UserJobController'
        })
        .when('/user/:userId/markedjobs', {
            templateUrl: '/html/marked_view.html',
            controller: 'MarkJobController'
        })

        .otherwise({
            templateUrl: '/html/view.html',
            controller: 'ViewController'
        });

    // configure html5 to get links working on jsfiddle
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });

});