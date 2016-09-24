define(
[
  'ContentDimensionController',
  'Content/Application',
  'Library/jquery-with-dependencies',
],
function (
  ContentDimensionController,
  ContentModule,
  $
) {

  ContentDimensionController.reopen({

    _setDimensionBasedOnUrl: function () {
      var uri = location.href;
      var dimensions = this.get('dimensions');
      var matches = uri.match(/@.+;(.+)$/);
      if (matches) {
        var dimensionValues = matches[1].split('&');
        $.each(dimensionValues, function (index, dimensionValue) {
          var parts = dimensionValue.split('=');
          var dimensionName = parts[0];
          var presetIdentifier = parts[1];

          var dimension = dimensions.findBy('identifier', dimensionName);
          dimension.presets.setEach('selected', false);
          var selectedPreset = dimension.presets.findBy('identifier', presetIdentifier);
          selectedPreset.set('selected', true);
          dimension.set('selected', selectedPreset);
        });
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
          // skip wildcard, alread handled this case
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