(function() {
    'use strict';

    
    angular.module( 'ngTextTruncate', [] )


    .directive( "ngTextTruncate", [ "$compile", "ValidationServices", "CharBasedTruncation", "WordBasedTruncation" ,"EscapeHtml",
    	function( $compile, ValidationServices, CharBasedTruncation, WordBasedTruncation, EscapeHtml ) {
        return {
            restrict: "A",
            scope: {
                text: "=ngTextTruncate",
                charsThreshould: "@ngTtCharsThreshold",
                wordsThreshould: "@ngTtWordsThreshold",
                customMoreLabel: "@ngTtMoreLabel",
                customLessLabel: "@ngTtLessLabel"
            },
            controller: function( $scope, $element, $attrs ) {
                $scope.toggleShow = function() {
                    $scope.open = !$scope.open;
                };

                $scope.useToggling = $attrs.ngTtNoToggling === undefined;
            },
            link: function( $scope, $element, $attrs ) {
                $scope.open = false;

                ValidationServices.failIfWrongThreshouldConfig( $scope.charsThreshould, $scope.wordsThreshould );

                var CHARS_THRESHOLD = parseInt( $scope.charsThreshould );
                var WORDS_THRESHOLD = parseInt( $scope.wordsThreshould );

                $scope.$watch( "text", function() {
                    $element.empty();

                    $scope.etext = EscapeHtml.escape($scope.text);
                    
                    if( CHARS_THRESHOLD ) {
                            if( $scope.etext && CharBasedTruncation.truncationApplies( $scope, CHARS_THRESHOLD ) ) {
                                CharBasedTruncation.applyTruncation( CHARS_THRESHOLD, $scope, $element );

                            } else {
                                $element.append( $scope.etext);
                            }

                    } else {

                        if( $scope.etext && WordBasedTruncation.truncationApplies( $scope, WORDS_THRESHOLD ) ) {
                            WordBasedTruncation.applyTruncation( WORDS_THRESHOLD, $scope, $element );

                        } else {
                            $element.append( $scope.etext );
                        }

                    }
                } );
            }
        };
    }] )

    .factory('EscapeHtml', function () {
        return {
            escape: function(str) {
                var entityMap = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': '&quot;',
                    "'": '&#39;',
                    "/": '&#x2F;'
                };
                return String(str).replace(/[&<>"'\/]/g, function (s) {
                    return entityMap[s];
                });
            }
        }
    })


    .factory( "ValidationServices", function() {
        return {
            failIfWrongThreshouldConfig: function( firstThreshould, secondThreshould ) {
                if( (! firstThreshould && ! secondThreshould) || (firstThreshould && secondThreshould) ) {
                    throw "You must specify one, and only one, type of threshould (chars or words)";
                }
            }
        };
    })



    .factory( "CharBasedTruncation", [ "$compile", function( $compile ) {
        return {
            truncationApplies: function( $scope, threshould ) {
                return $scope.etext.length > threshould;
            },

            applyTruncation: function( threshould, $scope, $element ) {
                if( $scope.useToggling ) {
                    var el = angular.element(    "<span>" + 
                                                    ($scope.etext.substr( 0, threshould )) + 
                                                    "<span ng-show='!open'>...</span>" +
                                                    "<span class='btn-link ngTruncateToggleText' " +
                                                        "ng-click='toggleShow()'" +
                                                        "ng-show='!open'>" +
                                                        " " + ($scope.customMoreLabel ? $scope.customMoreLabel : "More") +
                                                    "</span>" +
                                                    "<span ng-show='open'>" + 
                                                    ($scope.etext.substring( threshould )) + 
                                                        "<span class='btn-link ngTruncateToggleText'" +
                                                              "ng-click='toggleShow()'>" +
                                                            " " + ($scope.customLessLabel ? $scope.customLessLabel : "Less") +
                                                        "</span>" +
                                                    "</span>" +
                                                "</span>" );
                    $compile( el )( $scope );
                    $element.append( el );

                } else {
                    $element.append( $scope.etext.substr( 0, threshould ) + "..." );

                }
            }
        };
    }])



    .factory( "WordBasedTruncation", [ "$compile", function( $compile ) {
        return {
            truncationApplies: function( $scope, threshould ) {
                return $scope.etext.split( " " ).length > threshould;
            },

            applyTruncation: function( threshould, $scope, $element ) {
                var splitText = ($scope.etext).split( " " );
                if( $scope.useToggling ) {
                    var el = angular.element(    "<span>" + 
                                                    splitText.slice( 0, threshould ).join( " " ) + " " + 
                                                    "<span ng-show='!open'>...</span>" +
                                                    "<span class='btn-link ngTruncateToggleText' " +
                                                        "ng-click='toggleShow()'" +
                                                        "ng-show='!open'>" +
                                                        " " + ($scope.customMoreLabel ? $scope.customMoreLabel : "More") +
                                                    "</span>" +
                                                    "<span ng-show='open'>" + 
                                                        splitText.slice( threshould, splitText.length ).join( " " ) + 
                                                        "<span class='btn-link ngTruncateToggleText'" +
                                                              "ng-click='toggleShow()'>" +
                                                            " " + ($scope.customLessLabel ? $scope.customLessLabel : "Less") +
                                                        "</span>" +
                                                    "</span>" +
                                                "</span>" );
                    $compile( el )( $scope );
                    $element.append( el );

                } else {
                    $element.append( splitText.slice( 0, threshould ).join( " " ) + "..." );
                }
            }
        };
    }]);
    
}());
