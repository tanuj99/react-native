/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const Platform = require('Platform');
const RCTLog = require('RCTLog');
const React = require('React');
const YellowBoxList = require('YellowBoxList');
const YellowBoxRegistry = require('YellowBoxRegistry');

import type {Category} from 'YellowBoxCategory';
import type {Registry, Subscription} from 'YellowBoxRegistry';

type Props = $ReadOnly<{||}>;
type State = {|
  registry: ?Registry,
|};

const {error, warn} = console;

/**
 * YellowBox displays warnings at the bottom of the screen.
 *
 * Warnings help guard against subtle yet significant issues that can impact the
 * quality of the app. This "in your face" style of warning allows developers to
 * notice and correct these issues as quickly as possible.
 *
 * YellowBox is only enabled in `__DEV__`. Set the following flag to disable it:
 *
 *   console.disableYellowBox = true;
 *
 * Ignore specific warnings by calling:
 *
 *   YellowBox.ignoreWarnings(['Warning: ...']);
 *
 * Strings supplied to `YellowBox.ignoreWarnings` only need to be a substring of
 * the ignored warning messages.
 */
class YellowBox extends React.Component<Props, State> {
  static ignoreWarnings(patterns: $ReadOnlyArray<string>): void {
    YellowBoxRegistry.addIgnorePatterns(patterns);
  }

  static install(): void {
    (console: any).error = function(...args) {
      error.call(console, ...args);
      // Show YellowBox for the `warning` module.
      if (typeof args[0] === 'string' && args[0].startsWith('Warning: ')) {
        registerWarning(...args);
      }
    };

    (console: any).warn = function(...args) {
      warn.call(console, ...args);
      registerWarning(...args);
    };

    if ((console: any).disableYellowBox === true) {
      YellowBoxRegistry.setDisabled(true);
    }
    (Object.defineProperty: any)(console, 'disableYellowBox', {
      configurable: true,
      get: () => YellowBoxRegistry.isDisabled(),
      set: value => YellowBoxRegistry.setDisabled(value),
    });

    if (Platform.isTesting) {
      (console: any).disableYellowBox = true;
    }

    RCTLog.setWarningHandler((...args) => {
      registerWarning(...args);
    });
  }

  static uninstall(): void {
    (console: any).error = error;
    (console: any).warn = error;
    delete (console: any).disableYellowBox;
  }

  _subscription: ?Subscription;

  state = {
    registry: null,
  };

  render() {
    // TODO: Ignore warnings that fire when rendering `YellowBox` itself.
    return this.state.registry == null ? null : (
      <YellowBoxList
        onDismiss={this._handleDismiss}
        onDismissAll={this._handleDismissAll}
        registry={this.state.registry}
      />
    );
  }

  componentDidMount(): void {
    this._subscription = YellowBoxRegistry.observe(registry => {
      this.setState({registry});
    });
  }

  componentWillUnmount(): void {
    if (this._subscription != null) {
      this._subscription.unsubscribe();
    }
  }

  _handleDismiss = (category: Category): void => {
    YellowBoxRegistry.delete(category);
  };

  _handleDismissAll(): void {
    YellowBoxRegistry.clear();
  }
}

function registerWarning(...args): void {
  YellowBoxRegistry.add({args, framesToPop: 2});
}

module.exports = YellowBox;