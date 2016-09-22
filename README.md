## Fix for ContentDimensionsSelector

the current content selector in the UI does not respect constraints correctly due to a [mailformed service URL](https://github.com/neos/flow-development-collection/issues/640).

This implementation works without making any rest request to the server, thus works without delay.