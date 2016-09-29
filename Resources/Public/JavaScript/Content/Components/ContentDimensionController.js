define(
[
  'emberjs',
  'ContentDimensionController',
  'Content/Application',
  'Shared/EventDispatcher',
  'Library/underscore'
],
function (
  Ember,
  ContentDimensionController,
  ContentModule,
  EventDispatcher,
  _
) {

  ContentDimensionController.reopen({

    _contentDimensionDidChange: false,

    _setDimensionBasedOnUrl: function () {

      var uri = location.href;
      var dimensions = this.get('dimensions');
      var matches = uri.match(/@.+;(.+?)(?:\.[^.]+)?$/);
      var shouldTrigger = false;

      if (matches) {
        var dimensionValues = matches[1].split('&');
        _.each(dimensionValues, function (dimensionValue) {
          var parts = dimensionValue.split('=');
          var dimensionName = parts[0];
          var presetIdentifiers = parts[1].split(',');
          var dimension = dimensions.findBy('identifier', dimensionName);

          if (dimension && !_.isEqual(dimension.get('selected.values', presetIdentifiers))) {
            shouldTrigger = true;
            dimension.presets.setEach('selected', false);
            var selectedPreset = _.find(dimension.presets, function (preset) {
              return _.isEqual(preset.get('values'), presetIdentifiers);
            });
            selectedPreset.set('selected', true);
            dimension.notifyPropertyChange('presets');
          }

        });
      }

      // Dimensions differ from selection of dimension selector
      // This could happen when a user clicks a dimension menu inside the template
      // in this case we should reload the navigation by triggering the respective event
      if (shouldTrigger) {
        if (this._contentDimensionDidChange) {
          this._contentDimensionDidChange = false;
        } else {
          EventDispatcher.trigger('contentDimensionsSelectionChanged');
        }
      }
    },

    _updateAvailableDimensionPresetsAfterChoosingPreset: function() {

      var dimensions = this.get('dimensions');
      _.each(dimensions, function (dimension) {
        var allConstraints = dimension.get('selected.constraints') || {};
        _.each(allConstraints, function (constraints, dimensionName) {
          var currentDimension = dimensions.findBy('identifier', dimensionName);
          // Set all preset depending on the wildcard configuration
          currentDimension.presets.setEach('disabled', constraints['*'] === false);

          _.each(constraints, function (allowed, presetIdentifier) {
            // skip wildcard, already handled this case
            if (presetIdentifier === '*')
              return;

            currentDimension.presets.findBy('identifier', presetIdentifier).set('disabled', !allowed);
          });

          // The currently selected preset is not allowed anymore
          if (currentDimension.get('selected.disabled')) {
            currentDimension.set('selected.selected', false);
            var firstAllowedPreset = currentDimension.presets.findBy('disabled', false);
            if (firstAllowedPreset) {
              currentDimension.set('selected', firstAllowedPreset);
              firstAllowedPreset.set('selected', true);
            }
          }
        });
      });
    }
  });

  EventDispatcher.on('contentDimensionsSelectionChanged', function () {
    ContentDimensionController._contentDimensionDidChange = true;
  });

  var initializing = true;
  ContentModule.on('pageLoaded', function () {

    if (initializing) {
      initializing = false;
      return;
    }

    setTimeout(function () {
      ContentDimensionController._setDimensionBasedOnUrl();
    }, 10);
  });

  return ContentDimensionController;
});