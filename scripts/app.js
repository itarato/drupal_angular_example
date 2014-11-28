/**
 * @file
 */

'use strict';

var drupalRoot = 'http://localhost/drupal7/';

angular

    .module('drupalAngularExample', [ 'ngRoute', 'ngResource', 'ngCookies' ])

    .config(function ( $routeProvider, $httpProvider ) {
        // Setting up the routes.
        $routeProvider
            .when('/login', {
                templateUrl: 'views/login.html',
                controller: 'LoginCtrl',
            })
            .when('/node/list/:page', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .when('/node/add', {
                templateUrl: 'views/node_add.html',
                controller: 'NodeAddCtrl'
            })
            .when('/node/:nid', {
                templateUrl: 'views/node.html',
                controller: 'NodeCtrl'
            })
            .when('/user/:uid', {
                templateUrl: 'views/user.html',
                controller: 'UserCtrl'
            })
            .otherwise({
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            });

        // Adjustment for Drupal.
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRF-TOKEN';
    })

    .value('drupalRoot', drupalRoot)
    .value('drupalImageRoot', drupalRoot + 'sites/default/files/field/image/')
    .value('apiPath', 'api/v1')

    .factory('Node', function ( $resource, drupalRoot, apiPath ) {
        return $resource(drupalRoot + apiPath + '/node/:nid');
    })

    .factory('User', function ( $resource, drupalRoot, apiPath ) {
        return $resource(drupalRoot + apiPath + '/user/:uid');
    })

    .factory('Account', function ( $http, drupalRoot, apiPath, $cookies ) {
        var account = {
            token: null,
            user: null,
            sessid: null,
            session_name: null
        };

        account.isLoggedIn = function () {
            return this.token !== null;
        };

        account.setUpFromLoginResponse = function ( data ) {
            this.user = data.user;
            this.sessid = data.sessid;
            this.session_name = data.session_name;
            this.token = data.token || this.token;
        };

        console.log('Check user login state');
        $http.post(drupalRoot + apiPath + '/user/token', {}).success(function ( data ) {
            console.log('State is verified', data);
            account.token = data.token;
            $cookies['XSRF-TOKEN'] = data.token;
            $cookies['CSRF-TOKEN'] = data.token;

            console.log('Attempt to load logged in user details');
            $http.post(drupalRoot + apiPath + '/system/connect', {})
                .success(function ( data ) {
                    console.log('User details arrived', data);
                    account.setUpFromLoginResponse(data);
                });
        });

        return account;
    })

    .controller('MainCtrl', function ( $scope, Node, $routeParams, Account, $http, drupalRoot, apiPath ) {
        $scope.page = parseInt($routeParams.page || 0);
        $scope.account = Account;

        $scope.updateNodeList = function ( ) {
            $scope.nodes = Node.query({pagesize: 10, page: $scope.page});
        };
        $scope.updateNodeList();

        $scope.deleteNode = function ( nid ) {
            console.log('Attempt delete node', nid);

            $http.delete(drupalRoot + apiPath + '/node/' + nid)
                .success(function ( ) {
                    console.log('Delete successful');
                    $scope.updateNodeList();
                });
        };
    })

    .controller('NodeCtrl', function ( $scope, $routeParams, Node, drupalImageRoot ) {
        $scope.drupalImageRoot = drupalImageRoot;
        $scope.node = Node.get({nid: $routeParams.nid});
    })

    .controller('NodeAddCtrl', function ( $scope, Node, Account, $location ) {
        $scope.account = Account;

        $scope.add = function () {
            console.log('Node save attempt');
            Node.save({
                title: this.title,
                type: 'article',
                body: this.body,
                uid: Account.user.uid
            }, function ( data ) {
                console.log('Node save - success', data);
                $location.path('/node/' + data.nid);
            });
        };
    })

    .controller('UserCtrl', function ( $scope, $routeParams, User ) {
        $scope.user = User.get({uid: $routeParams.uid});
    })

    .controller('LoginCtrl', function ( $scope, $http, Account, drupalRoot, apiPath ) {
        $scope.login = function ( ) {
            console.log('User login attempt');
            $http.post(drupalRoot + apiPath + '/user/login', {
                username: $scope.username,
                password: $scope.password
            }).success(function ( data, status, headers, config ) {
                console.log('User login - success', data);
                Account.setUpFromLoginResponse(data);
            });
        };
    });
