/**
 * @file
 */

'use strict';

// Base path for the backe
var RESTEndpoint = 'http://localhost/drupal7/api/v1';

/**
 * Main module definition.
 */
angular

    // Module name and dependencies.
    .module('drupalAngularExample', [ 'ngRoute', 'ngResource', 'ngCookies' ])

    // Configuration.
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

    // Value factories.
    .value('RESTEndpoint', RESTEndpoint)
    .value('drupalImageRoot', 'http://localhost/drupal7/sites/default/files/field/image/')

    // Resource factories:
    // Node resource.
    .factory('Node', function ( $resource, RESTEndpoint ) {
        return $resource(RESTEndpoint + '/node/:nid');
    })

    // User resource.
    .factory('User', function ( $resource, RESTEndpoint ) {
        return $resource(RESTEndpoint + '/user/:uid');
    })

    // Account handler factory.
    .factory('Account', function ( $http, RESTEndpoint, $cookies ) {
        var account = {
            token: null,
            user: null,
            sessid: null,
            session_name: null
        };

        /**
         * Check if user is authenticated.
         * @returns {boolean}
         */
        account.isLoggedIn = function () {
            return this.user !== null && this.user.hasOwnProperty('uid') && this.user.uid > 0;
        };

        /**
         * Initialize params with the response object from user/login or system/connect.
         * @param data
         */
        account.setUpFromLoginResponse = function ( data ) {
            this.user = data.user || this.user;
            this.sessid = data.sessid || this.sessid;
            this.session_name = data.session_name || this.session_name;
            this.token = data.token || this.token;
            if (this.token) {
                $cookies['XSRF-TOKEN'] = this.token;
            }
        };

        /**
         * Logs user out.
         */
        account.logOut = function ( ) {
            this.user = null;
            this.sessid = null;
            this.session_name = null;
            this.token = null;
        };

        console.log('Check user login state');
        $http.post(RESTEndpoint + '/user/token', { }).success(function ( data ) {
            console.log('State is verified', data);
            account.setUpFromLoginResponse(data);
        }).then(function () {
            console.log('Attempt to load logged in user details');
            $http.post(RESTEndpoint + '/system/connect', { })
                .success(function ( data ) {
                    console.log('User details arrived', data);
                    account.setUpFromLoginResponse(data);
                });
        });

        return account;
    })

    // Account directive.
    .directive('account', function ( ) {
        return {
            restrict: 'A',
            templateUrl: 'views/account.html',
            controller: 'AccountCtrl'
        };
    })

    // Controllers:
    // Account directive controller.
    .controller('AccountCtrl', function ( $scope, Account, $http, RESTEndpoint ) {
        $scope.account = Account;

        $scope.logOut = function () {
            console.log('Attempt to logout');
            $http.post(RESTEndpoint + '/user/logout', { })
                .success(function ( ) {
                    console.log('Logout successful');
                    Account.logOut();
                });
        };
    })

    // Main page controller.
    .controller('MainCtrl', function ( $scope, Node, $routeParams, Account, $http, RESTEndpoint ) {
        $scope.page = parseInt($routeParams.page || 0);
        $scope.account = Account;

        $scope.updateNodeList = function ( ) {
            $scope.nodes = Node.query({pagesize: 10, page: $scope.page});
        };
        $scope.updateNodeList();

        $scope.deleteNode = function ( nid ) {
            console.log('Attempt delete node', nid);

            $http.delete(RESTEndpoint + '/node/' + nid)
                .success(function ( ) {
                    console.log('Delete successful');
                    $scope.updateNodeList();
                });
        };
    })

    // Node item controller.
    .controller('NodeCtrl', function ( $scope, $routeParams, Node, drupalImageRoot ) {
        $scope.drupalImageRoot = drupalImageRoot;
        $scope.node = Node.get({nid: $routeParams.nid});
    })

    // Node add form controller.
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

    // User item controller.
    .controller('UserCtrl', function ( $scope, $routeParams, User ) {
        $scope.user = User.get({uid: $routeParams.uid});
    })

    // Login action controller.
    .controller('LoginCtrl', function ( $scope, $http, Account, RESTEndpoint ) {
        $scope.login = function ( ) {
            console.log('User login attempt');
            $http.post(RESTEndpoint + '/user/login', {
                username: $scope.username,
                password: $scope.password
            }).success(function ( data ) {
                console.log('User login - success', data);
                Account.setUpFromLoginResponse(data);
            });
        };
    });
