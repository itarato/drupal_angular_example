Headless Drupal - Angular JS Example
====================================


This is an example implementation how AngularJS can be the web client for a Drupal site. On the interface a list of content is presented. The user can select one and go to the content detail page. From the detail page the author detail page is accessible.
The interface contains an authentication form, where the user can log in. After a successful login the content can be deleted or new can be created.

On the Drupal side Services module is used with REST server, and the following resources:

- user
- node
- system

(This example is rather a quick example than a best practices project, it's lacking any kind of structuring or responsibility separation. Also the emphasis is on REST services, the awesome binding features are better explained in the official documentation: https://docs.angularjs.org/guide/databinding).


The anatomy
-----------

Learn more: https://docs.angularjs.org/guide

Starting point is ```index.html``` where we load all script and set the directives so Angular knows it's handling it:

```html
<body ng-app="drupalAngularExample" role="document">
------^
```

```html
<div ng-view=""></div>
-----^
```


The module
----------

Learn more: https://docs.angularjs.org/guide/module

In the main script we define the Angular module which is responsible for the whole application:

```javascript
angular
    .module('drupalAngularExample', [ 'ngRoute', 'ngResource', 'ngCookies' ])
    ...
```

So whenever I need to extend the main module I just attach it on:

```javascript
angular.module('drupalAngularExample')...
```


The configuration
-----------------

Learn more: https://docs.angularjs.org/guide/module

Configuration is called at the initialization phase once, here we set up the router and be able to alter some default configuration:

```javascript
// Configuration.
    .config(function ( $routeProvider, $httpProvider ) {
        // Setting up the routes.
        $routeProvider
            .when('/login', {
                templateUrl: 'views/login.html',
                controller: 'LoginCtrl',
            })
            
            ...
            
            .otherwise({
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            });

        // Adjustment for Drupal.
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRF-TOKEN';
    })
```

ngRoute is an Angular extension that handles URLs and maps them to controllers, templates, etc.

The other change here is to alter the header name string for the CSRF token. Services module needs CSRF instead of XSRF. Any other service call information can be altered at this point.


The providers
-------------

Learn more: https://docs.angularjs.org/guide/providers

Factories are useful for many things, providing services, values, resources. These things are generated once - at the time when it's needed at first, then loaded from cache. These are mostly used through AngularJS's dependecy injection: https://docs.angularjs.org/guide/di

Providers can be simple values:

```javascript
.value('drupalImageRoot', 'http://localhost/drupal7/sites/default/files/field/image/')
```

Or more complex objects:

```javascript
    // Account handler factory.
    .factory('Account', function ( $http, REST_URL, $cookies ) {
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
         * Logs user out.
         */
        account.logOut = function ( ) {
            this.user = null;
            this.sessid = null;
            this.session_name = null;
            this.token = null;
        };
        
        ...

        return account;
    })
```


Resources and request handlers
------------------------------

Learn more: https://docs.angularjs.org/api/ngResource/service/$resource and https://docs.angularjs.org/api/ng/service/$http

AngularJS is prepared to work with objects that are stored remotely and requested/altered through network requests.

One of the basic service is ```$http```:

```javascript
$http.post(REST_URL + '/system/connect', { })
    .success(function ( data ) {
        console.log('User details arrived', data);
        account.setUpFromLoginResponse(data);
    });
```

This code for example is calling the ```system/connect``` resource to get the current user/session information.

As you can see accessing resources is quite accessible, however Angular has an even better interface for standard REST resources - it is the ```$resource``` service:

```javascript
// Resource factories:
// Node resource.
.factory('Node', function ( $resource, REST_URL ) {
    return $resource(REST_URL + '/node/:nid');
})
```

This will create a resource for Drupal nodes, so you can do the full CRUD with it:

```javascript
// Get all:
Node.query();

// Get one item:
Node.get({nid: nid});

// Update / create:
Node.save({ ... });

// Delete:
Node.delete({nid: nid});
```


Controllers
-----------

Learn more: https://docs.angularjs.org/guide/controller

Controllers are controllers, not easy to explain it any better, bundles the logic for the different pages, sections.
