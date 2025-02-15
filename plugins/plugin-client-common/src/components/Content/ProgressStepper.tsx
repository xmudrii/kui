/*
 * Copyright 2021 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react'
import { maybeKuiLink } from '@kui-shell/core/mdist/api/Response'

import Icons, { SupportedIcon } from '../spi/Icons'
import { subscribeToLinkUpdates, unsubscribeToLinkUpdates } from './LinkStatus'

import '../../../web/scss/components/ProgressStepper/_index.scss'

export type Status =
  | 'blank'
  | 'info'
  | 'minor'
  | 'current'
  | 'pending'
  | 'in-progress'
  | 'success'
  | 'warning'
  | 'error'
  | 'unknown'

function isStatus(status: string): status is Status {
  return (
    status === 'blank' ||
    status === 'info' ||
    status === 'minor' ||
    status === 'current' ||
    status === 'pending' ||
    status === 'in-progress' ||
    status === 'success' ||
    status === 'warning' ||
    status === 'error' ||
    status === 'unknown'
  )
}

/** Children is the description */
type ProgressStepProps = React.PropsWithChildren<{
  className?: string
  title: React.ReactNode

  customIcon?: React.ReactNode

  defaultStatus: Status | Promise<Status>
  liveStatusChannel?: string
}>

export interface ProgressStepState {
  status: Status
}

export function statusFromStatusVector(statusVector: number[], isMinor: boolean) {
  return statusVector[0] !== 0
    ? 'success'
    : statusVector[1] !== 0
    ? 'error'
    : statusVector[2] !== 0
    ? 'in-progress'
    : isMinor
    ? 'minor'
    : 'blank'
}

export function statusToClassName(status: Status) {
  return [`pf-m-${status}`]
}

const icons: Record<Status, { icon: SupportedIcon | ''; className?: string }> = {
  info: { icon: 'Info' },
  minor: { icon: '' },
  blank: { icon: '' },
  success: { icon: 'Checkmark' },
  warning: { icon: 'Warning', className: 'yellow-text' },
  error: { icon: 'Error', className: 'red-text' },
  unknown: { icon: 'Unknown', className: 'yellow-text' },
  current: { icon: 'Current' },
  pending: { icon: undefined },
  'in-progress': { icon: 'InProgress', className: 'kui--spin-animation yellow-text' }
}

export function statusToIcon(status: Status) {
  const { icon, className } = icons[status]
  return icon && <Icons icon={icon} className={className} />
}

export class ProgressStep extends React.PureComponent<ProgressStepProps, ProgressStepState> {
  public constructor(props: ProgressStepProps) {
    super(props)

    this.state = {
      status: typeof props.defaultStatus === 'string' ? props.defaultStatus : 'blank'
    }

    if (typeof props.defaultStatus !== 'string') {
      setTimeout(async () => {
        if (typeof props.defaultStatus !== 'string') {
          const status = await props.defaultStatus
          this.setState({ status })
        }
      })
    }
  }

  private get status() {
    return statusToClassName(this.state.status)
  }

  private icon() {
    if (this.props.customIcon) {
      return this.props.customIcon
    } else {
      return statusToIcon(this.state.status)
    }
  }

  private readonly _statusUpdateHandler = (statusVector: number[]) => {
    this.setState(curState => {
      return { status: statusFromStatusVector(statusVector, curState.status === 'minor') }
    })
  }

  /** Once we have mounted, subscribe to link status update events */
  public componentDidMount() {
    if (this.props.liveStatusChannel) {
      subscribeToLinkUpdates(this.props.liveStatusChannel, this._statusUpdateHandler)
    }
  }

  /** Bye! */
  public componentWillUnmount() {
    if (this.props.liveStatusChannel) {
      unsubscribeToLinkUpdates(this.props.liveStatusChannel, this._statusUpdateHandler)
    }
  }

  public render() {
    return (
      <li
        className={['pf-c-progress-stepper__step', 'kui--progress-step', ...this.status].join(' ')}
        aria-label="completed step,"
      >
        <div className="pf-c-progress-stepper__step-connector">
          <span className="pf-c-progress-stepper__step-icon kui--progress-step-status-icon">{this.icon()}</span>
        </div>
        <div className="pf-c-progress-stepper__step-main">
          {this.props.title && <div className="pf-c-progress-stepper__step-title">{this.props.title}</div>}
          {this.props.children && <div className="pf-c-progress-stepper__step-description">{this.props.children}</div>}
        </div>
      </li>
    )
  }
}

export interface ProgressStepperProps {
  className?: string
  layout?: 'vertical' | 'horizontal' | 'compact'
  children: React.ReactElement<ProgressStep> | React.ReactElement<ProgressStep>[]
}

export class ProgressStepper extends React.PureComponent<ProgressStepperProps> {
  public render() {
    return (
      <ol
        className={[
          'pf-c-progress-stepper',
          'kui--progress-stepper',
          `pf-m-${this.props.layout || 'vertical'}`,
          this.props.className
        ].join(' ')}
      >
        {this.props.children}
      </ol>
    )
  }
}

interface LinkStatusProps {
  /* Eslint fubar___ children: [
    { props: { href: string } }
    ] */
  children: any[]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ProgressStepCompatible<TitleProps = any> = {
  className?: string

  /* Eslint fubar___ children: [
    { type: 'strong', props?: TitleProps },
    any,
    { type: 'em', props: { children: [ { props: { children: Status } } ] } }
    ] */
  children: any[]
}

export function isProgressStepCompatible(props: any) /*: props is ProgressStepCompatible */ {
  return (
    Array.isArray(props.children) &&
    props.children.length >= 3 &&
    props.children[0].type === 'strong' &&
    props.children[2].type === 'em' &&
    Array.isArray(props.children[2].props.children) &&
    props.children[2].props.children.length === 1 &&
    typeof props.children[2].props.children[0] === 'string' &&
    isStatus(props.children[2].props.children[0])
  )
}

/* export function hasLinkStatus(props: ProgressStepCompatible): props is ProgressStepCompatible<LinkStatusProps> {
  return (
    typeof props.children[0].props === 'object' &&
    Array.isArray(props.children[0].props.children) &&
    props.children[0].props.children.length === 1 &&
    typeof props.children[0].props.children[0].props === 'object' &&
    typeof props.children[0].props.children[0].props.href === 'string' &&
    !!maybeKuiLink(props.children[0].props.children[0].props.href)
  )
} */

export function liveStatusChannel(props: ProgressStepCompatible<LinkStatusProps>): string {
  return (
    typeof props.children[0].props.children[0] === 'object' &&
    maybeKuiLink(props.children[0].props.children[0].props.href)
  )
}
