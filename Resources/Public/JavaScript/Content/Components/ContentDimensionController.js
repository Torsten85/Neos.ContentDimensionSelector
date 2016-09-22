define(
[
  'ContentDimensionController',
  'Library/jquery-with-dependencies'
],
function (
  ContentDimensionController,
  $
) {

  ContentDimensionController.reopen({

    _updateAvailableDimensionPresetsAfterChoosingPreset: function(changedDimension) {
      var dimensions = this.get('dimensions');
      var allConstraints = changedDimension.get('selected.constraints') || {};

      window.dimensions = dimensions;

      $.each(allConstraints, function (dimensionIdentifier, constraints) {
        var dimension = dimensions.findBy('identifier', dimensionIdentifier);

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

  return ContentDimensionController;
});