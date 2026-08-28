import React from 'react'
import AddNewExpense from './AddNewExpense'
import {AuthContext} from '@/app/context'

const signedOutAuth = {
  user: null,
  loading: false,
  isGuest: false,
  continueAsGuest: () => undefined,
  signOut: async () => undefined,
}

describe('<AddNewExpense />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<AuthContext.Provider value={signedOutAuth}><AddNewExpense /></AuthContext.Provider>)
  })
})
