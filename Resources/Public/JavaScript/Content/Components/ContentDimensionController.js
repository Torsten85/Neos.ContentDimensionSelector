define(
[
  'ContentDimensionController',
  'Content/Application',
  'Shared/EventDispatcher',
  'Library/jquery-with-dependencies',
  'Library/underscore'
],
function (
  ContentDimensionController,
  ContentModule,
  EventDispatcher,
  $,
  _
) {

  ContentDimensionController.reopen({

    _setDimensionBasedOnUrl: function () {

      var uri = location.href;
      var dimensions = this.get('dimensions');
      var matches = uri.match(/@.+;(.+?)(?:\.[^.]+)?$/);
      var shouldTrigger = false;

      if (matches) {
        var dimensionValues = matches[1].split('&');
        $.each(dimensionValues, function (index, dimensionValue) {
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
            dimension.set('selected', selectedPreset);
          }
        });
      }

      // Dimensions differ from selection of dimension selector
      // This could happen when a user clicks a dimension menu inside the template
      // in this case we should reload the navigation by triggering the respective event

      if (shouldTrigger) {
        EventDispatcher.trigger('contentDimensionsSelectionChanged');
      }
    },

    _updateAvailableDimensionPresetsAfterChoosingPreset: function(changedDimension) {
      var dimensions = this.get('dimensions');

      var allConstraints = changedDimension.get('selected.constraints') || {};

      $.each(allConstraints, function (dimensionName, constraints) {
        var dimension = dimensions.findBy('identifier', dimensionName);

        // Set all preset depending on the wildcard configuration
        dimension.presets.setEach('disabled', constraints['*'] === false);

        $.each(constraints, function (presetIdentifier, allowed) {
          // skip wildcard, already handled this case
          if (presetIdentifier === '*')
            return;

          dimension.presets.findBy('identifier', presetIdentifier).set('disabled', !allowed);
        });

        // The currently selected preset is not allowed anymore
        if (dimension.get('selected.disabled')) {
          dimension.set('selected.selected', false);
          var firstAllowedPreset = dimension.presets.findBy('disabled', false);
          if (firstAllowedPreset) {
            dimension.set('selected', firstAllowedPreset);
            firstAllowedPreset.set('selected', true);
          }
        }
      });
    }
  });

  ContentModule.on('pageLoaded', function () {
    ContentDimensionController._setDimensionBasedOnUrl();
  });

  return ContentDimensionController;
});