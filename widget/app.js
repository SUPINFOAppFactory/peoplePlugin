'use strict';

(function (angular, buildfire) {
  angular
    .module('peoplePluginWidget', [
      'peopleEnums',
      'peopleFilters',
      'peopleWidgetServices',
      'ngAnimate',
      'ngRoute',
      'ui.bootstrap',
      'infinite-scroll'
    ])
    .constant('TAG_NAMES', {
      PEOPLE_INFO: 'peopleInfo',
      PEOPLE: 'people'
    })
    .constant('ERROR_CODE', {
      NOT_FOUND: 'NOTFOUND'
    })
    .config(['$routeProvider', '$compileProvider', function ($routeProvider, $compileProvider) {

      /**
       * To make href urls safe on mobile
       */
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|cdvfile|file):/);


      $routeProvider
        .when('/', {
          template: '<div></div>'
        })
        .when('/people/:id', {
          templateUrl: 'templates/people.html',
          controllerAs: 'WidgetPeople',
          controller: 'WidgetPeopleCtrl'
        })
        .otherwise('/');
    }])
    .factory('Buildfire', [function () {
      return buildfire;
    }])
    .factory('Location', [function () {
      var _location = window.location;
      return {
        goTo: function (path) {
          _location.href = path;
        },
        goToHome: function () {
          _location.href = _location.href.substr(0, _location.href.indexOf('#'));
        }
      };
    }])
/*    .filter('getImageUrl', ['Buildfire', function (Buildfire) {
      filter.$stateful = true;
      function filter(url, width, height, type) {
        var _imgUrl;
        if (!_imgUrl) {
          if (type == 'resize') {
            Buildfire.imageLib.local.resizeImage(url, {
              width: width,
              height: height
            }, function (err, imgUrl) {
              _imgUrl = imgUrl;
            });
          } else {
            Buildfire.imageLib.local.cropImage(url, {
              width: width,
              height: height
            }, function (err, imgUrl) {
              _imgUrl = imgUrl;
            });
          }
        }

        return _imgUrl;
      }
      return filter;
    }])*/
    .directive("buildFireCarousel", ["$rootScope", function ($rootScope) {
      return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
          $rootScope.$broadcast("Carousel:LOADED");
        }
      };
    }])
    .directive("loadImage", ['Buildfire', function (Buildfire) {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          element.attr("src", "../../../styles/media/holder-" + attrs.loadImage + ".gif");

          var _img = attrs.finalSrc;
          if (attrs.cropType == 'resize') {
            Buildfire.imageLib.local.resizeImage(_img, {
              width: attrs.cropWidth,
              height: attrs.cropHeight
            }, function (err, imgUrl) {
              _img = imgUrl;
              replaceImg(_img);
            });
          } else {
            Buildfire.imageLib.local.cropImage(_img, {
              width: attrs.cropWidth,
              height: attrs.cropHeight
            }, function (err, imgUrl) {
              _img = imgUrl;
              replaceImg(_img);
            });
          }

          function replaceImg(finalSrc) {
            var elem = $("<img>");
            elem[0].onload = function () {
              element.attr("src", finalSrc);
              elem.remove();
            };
            elem.attr("src", finalSrc);
          }
        }
      };
    }])
    .run(['Location', '$location', '$rootScope', function (Location, $location, $rootScope) {
      buildfire.messaging.onReceivedMessage = function (msg) {
        var currentUrl = $location.$$url;
        switch (msg.type) {
          case 'AddNewItem':
            Location.goTo("#/people/" + msg.id + "?stopSwitch=true");
            break;
          case 'OpenItem':
            Location.goTo("#/people/" + msg.id);
            break;
          default:
            if (currentUrl != '/') {
              Location.goToHome();
            }
        }
      };
      buildfire.deeplink.getData(function (data) {
        if (data) {
          Location.goTo("#/people/" + JSON.parse(data).id);
        }
      });

      buildfire.navigation.onBackButtonClick = function () {
        if (($location.path() != '/')) {
          buildfire.messaging.sendMessageToControl({});
          $rootScope.showHome = true;
          Location.goTo('#/');
        }
        else {
          buildfire.navigation._goBackOne();
        }
      };
    }]).filter('cropImage', [function () {
      function filter (url, width, height, noDefault) {
        var _imgUrl;
        filter.$stateful = true;
        if(noDefault)
        {
          if(!url)
            return '';
        }
        if (!_imgUrl) {
          buildfire.imageLib.local.cropImage(url, {
            width: width,
            height: height
          }, function (err, imgUrl) {
            _imgUrl = imgUrl;
          });
        }
        return _imgUrl;
      }
      return filter;
    }]).directive('backImg', ["$rootScope", function ($rootScope) {
      return function (scope, element, attrs) {
        attrs.$observe('backImg', function (value) {
          var img = '';
          if (value) {
            buildfire.imageLib.local.cropImage(value, {
              width: $rootScope.deviceWidth,
              height: $rootScope.deviceHeight
            }, function (err, imgUrl) {
              if (imgUrl) {
                img = imgUrl;
                element.attr("style", 'background:url(' + img + ') !important ; background-size: cover !important;');
              } else {
                img = '';
                element.attr("style", 'background-color:white');
              }
              element.css({
                'background-size': 'cover'
              });
            });
            // img = $filter("cropImage")(value, $rootScope.deviceWidth, $rootScope.deviceHeight, true);
          }
          else {
            img = "";
            element.attr("style", 'background-color:white');
            element.css({
              'background-size': 'cover'
            });
          }
        });
      };
    }]);
})(window.angular, window.buildfire);