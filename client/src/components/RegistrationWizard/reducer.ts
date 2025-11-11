import { WizardState, WizardAction, initialWizardState } from './types';

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: Math.max(1, Math.min(4, action.step)),
      };
    
    case 'UPDATE_STEP_1':
      return {
        ...state,
        step1: { ...state.step1, ...action.data },
      };
    
    case 'UPDATE_STEP_2':
      return {
        ...state,
        step2: { ...state.step2, ...action.data },
      };
    
    case 'UPDATE_STEP_3':
      return {
        ...state,
        step3: { ...state.step3, ...action.data },
      };
    
    case 'UPDATE_STEP_4':
      return {
        ...state,
        step4: { ...state.step4, ...action.data },
      };
    
    case 'MARK_SIREN_VALIDATED':
      return {
        ...state,
        sirenValidated: true,
      };
    
    case 'MARK_ADDRESS_VALIDATED':
      return {
        ...state,
        addressValidated: true,
      };
    
    case 'RESET':
      return initialWizardState;
    
    default:
      return state;
  }
}
