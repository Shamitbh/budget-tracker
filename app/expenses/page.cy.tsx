import React from 'react'
import Page from './page'
import {AuthContext} from '@/app/context'

const signedOutAuth = {
  user: null,
  loading: true,
  isGuest: false,
  continueAsGuest: () => undefined,
  signOut: async () => undefined,
}

describe('<page />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<AuthContext.Provider value={signedOutAuth}><Page /></AuthContext.Provider>)
  })
})
