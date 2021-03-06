angular.module('ngIntlTelInput')
  .directive('ngIntlTelInput', ['ngIntlTelInput', '$log', '$window', '$parse', '$timeout',
    function (ngIntlTelInput, $log, $window, $parse, $timeout) {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attr, ctrl) {
          var cleave;
          // Warning for bad directive usage.
          if ((!!attr.type && (attr.type !== 'text' && attr.type !== 'tel')) || elm[0].tagName !== 'INPUT') {
            $log.warn('ng-intl-tel-input can only be applied to a *text* or *tel* input');
            return;
          }
          // Override default country.
          if (attr.initialCountry) {
            ngIntlTelInput.set({initialCountry: attr.initialCountry});
          }
          // Initialize.
          ngIntlTelInput.init(elm);


          scope.$watch(function(){
            return elm[0].value;
          }, function(newVal, oldVal){
            if (newVal && newVal.length>5){
              newVal = newVal.replace("+33 0", "+33");
              elm.val(newVal);
            }
            if(!cleave && newVal){
              const countryData = elm.intlTelInput('getSelectedCountryData');
              cleave = new Cleave(elm[0], {
                  phone: true,
                  phoneRegionCode: countryData.iso2,
                  onValueChanged: function (e) {
                        if(ctrl.$validators.ngIntlTelInput(e.target.value)){
                            ctrl.$setValidity('ngIntlTelInput', true);
                            $timeout(function(){
                                scope.$apply(function(){
                                    ctrl.$setViewValue(e.target.value);
                                });
                            });
                        }
                    }
              });
            }
            if(oldVal.length>=2 && newVal.length>=2){
              if(oldVal.substr(0, 2) != newVal.substr(0, 2)){
                if(!ctrl.$validators.ngIntlTelInput(newVal)){
                    ctrl.$setValidity('ngIntlTelInput', false);
                }else{
                    ctrl.$setValidity('ngIntlTelInput', true);
                }
                const countryData = elm.intlTelInput('getSelectedCountryData');
                cleave.setPhoneRegionCode(countryData.iso2);
                elm[0].value = "+" + countryData.dialCode;
              }

            }

          });
          // Set Selected Country Data.
          function setSelectedCountryData(model) {
            var getter = $parse(model);
            var setter = getter.assign;
            setter(scope, elm.intlTelInput('getSelectedCountryData'));
          }
          // Handle Country Changes.
          function handleCountryChange() {
            setSelectedCountryData(attr.selectedCountry);
          }
          // Country Change cleanup.
          function cleanUp() {
            angular.element($window).off('countrychange', handleCountryChange);
          }
          // Selected Country Data.
          if (attr.selectedCountry) {
            setSelectedCountryData(attr.selectedCountry);
            angular.element($window).on('countrychange', handleCountryChange);
            scope.$on('$destroy', cleanUp);
          }
          // Validation.
          ctrl.$validators.ngIntlTelInput = function (value) {
            // if phone number is deleted / empty do not run phone number validation
            if (value || elm[0].value.length > 0) {
                return elm.intlTelInput('isValidNumber');
            } else {
                return true;
            }
          };
          // Set model value to valid, formatted version.
          ctrl.$parsers.push(function (value) {
            return elm.intlTelInput('getNumber');
          });
          // Set input value to model value and trigger evaluation.
          ctrl.$formatters.push(function (value) {
            if (value) {
              if(value.charAt(0) !== '+') {
                value = '+' + value;
              }
              elm.intlTelInput('setNumber', value);
            }
            return value;
          });
        }
      };
    }]);
