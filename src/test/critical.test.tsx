import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// 1. Test Cancellation Rules
import { isLateCancellation, getCancellationStatus } from '../utils/cancellation';

describe('Cancellation Business Rules', () => {
  it('identifies late cancellations (under 24 hours)', () => {
    const now = new Date('2026-06-14T12:00:00Z');
    
    // 25 hours ahead -> not late
    const earlyAppt = '2026-06-15T13:00:00Z';
    expect(isLateCancellation(earlyAppt, now)).toBe(false);
    expect(getCancellationStatus(false)).toBe('cancelled_by_client');

    // 23 hours ahead -> late cancellation
    const lateAppt = '2026-06-15T11:00:00Z';
    expect(isLateCancellation(lateAppt, now)).toBe(true);
    expect(getCancellationStatus(true)).toBe('no_show');
  });
});



// 3. Test FormRenderer Component
import FormRenderer, { FormField } from '../components/common/FormRenderer';

describe('Dynamic Form Renderer Component', () => {
  const mockSchema: FormField[] = [
    { id: 'f1', type: 'text', label: 'Bolesť chrbta', required: true },
    { id: 'f2', type: 'vas_scale', label: 'Intenzita', required: false },
    { id: 'f3', type: 'checkbox', label: 'Absolvoval operáciu', required: false },
  ];

  it('renders inputs and propagates state changes', () => {
    const mockValues = { f1: 'Tupá bolesť', f2: 4, f3: false };
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <FormRenderer
        schema={mockSchema}
        values={mockValues}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByLabelText(/Bolesť chrbta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bolesť chrbta/i)).toHaveValue('Tupá bolesť');

    // Trigger input change
    fireEvent.change(screen.getByLabelText(/Bolesť chrbta/i), { target: { value: 'Ostrá bolesť' } });
    expect(onChange).toHaveBeenCalledWith('f1', 'Ostrá bolesť');

    // Submit form
    fireEvent.submit(screen.getByRole('button', { name: /Uložiť záznam do DB/i }));
    expect(onSubmit).toHaveBeenCalled();
  });
});

// 4. Test Prescription Builder Component
import Prescription, { ExerciseListItem, ClientListItem, WorkoutPlanItem } from '../components/training/Prescription';

describe('Prescription Component', () => {
  const mockClients: ClientListItem[] = [
    { id: 'c1', full_name: 'Roman Kovac', role: 'klient' },
  ];
  const mockExercises: ExerciseListItem[] = [
    { id: 'e1', title: 'Mostík na jednej nohe' },
  ];
  const mockPlans: WorkoutPlanItem[] = [
    { id: 'w1', exercise_title: 'Mostík na jednej nohe', sets: 3, reps: 10, tempo: '3-0-3', pause: '60s', notes: 'Pozor na panvu', completed: false },
  ];

  it('handles client selection and prescription flow', () => {
    const onChangeClient = vi.fn();
    const onPrescribe = vi.fn();
    const onDelete = vi.fn();

    render(
      <Prescription
        clients={mockClients}
        selectedClientId="c1"
        onChangeClient={onChangeClient}
        exercises={mockExercises}
        workoutPlans={mockPlans}
        onPrescribe={onPrescribe}
        onDelete={onDelete}
      />
    );

    // Verify it lists prescribed plan
    expect(screen.getByText('Mostík na jednej nohe', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('3', { selector: 'strong' })).toBeInTheDocument();

    // Trigger custom prescription submit
    fireEvent.submit(screen.getByRole('button', { name: /Uložiť do plánu v DB/i }));
    expect(onPrescribe).toHaveBeenCalledWith({
      exercise_title: 'Mostík na jednej nohe',
      sets: 3,
      reps: 10,
      tempo: '3-0-3',
      pause: '60s',
      notes: '',
    });

    // Delete item
    fireEvent.click(screen.getByRole('button', { name: /Zmazať/i }));
    expect(onDelete).toHaveBeenCalledWith('w1');
  });
});

// 5. Test GdprWizard Component
import GdprWizard, { ClientProfile } from '../components/gdpr/GdprWizard';

describe('GdprWizard Onboarding Flow', () => {
  const mockProfile: ClientProfile = {
    id: 'u1',
    role: 'klient',
    full_name: '',
    phone: '',
    gdpr_signed_at: null,
    metadata: {},
  };

  it('validates mandatory steps and triggers submission on final stage', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onSignOut = vi.fn();

    render(
      <GdprWizard
        sessionUser={{ email: 'klient@sportwell.sk' }}
        currentUserProfile={mockProfile}
        onSubmit={onSubmit}
        onSignOut={onSignOut}
      />
    );

    // STEP 1
    fireEvent.change(screen.getByLabelText(/Meno/i), { target: { value: 'Jozef' } });
    fireEvent.change(screen.getByLabelText(/Priezvisko/i), { target: { value: 'Mrkva' } });
    fireEvent.change(screen.getByLabelText(/Telefónne číslo/i), { target: { value: '+421901000222' } });
    fireEvent.change(screen.getByLabelText(/Dátum narodenia/i), { target: { value: '1995-10-10' } });
    fireEvent.change(screen.getByLabelText(/Trvalý pobyt/i), { target: { value: 'Mlynska 5, Kosice' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'klient@sportwell.sk' } });

    // Submit step 1
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať na výber služby/i }));

    // STEP 2: SERVICE CHOICE
    // The default is 'Fyzioterapia a diagnostika'. Let's select it and submit.
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať na súhlasy/i }));

    // STEP 3: REQUIRED CONSENTS
    // Expect terms and privacy checkboxes
    const privacyCheckbox = screen.getByLabelText(/Oboznámenie sa s pravidlami ochrany osobných údajov/i);
    const termsCheckbox = screen.getByLabelText(/Súhlas s podmienkami používania rezervačného systému/i);

    expect(screen.getByRole('button', { name: /Dokončiť registráciu/i })).toBeDisabled();
    
    // Check both
    fireEvent.click(privacyCheckbox);
    fireEvent.click(termsCheckbox);
    expect(screen.getByRole('button', { name: /Dokončiť registráciu/i })).toBeEnabled();

    // Submit step 3
    fireEvent.click(screen.getByRole('button', { name: /Dokončiť registráciu/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      firstName: 'Jozef',
      lastName: 'Mrkva',
      birthDate: '1995-10-10',
      address: 'Mlynska 5, Kosice',
      email: 'klient@sportwell.sk',
      phone: '+421901000222',
      primaryInterest: 'Fyzioterapia a diagnostika',
      marketingAccepted: false,
      metaAccepted: false,
      diagAccepted: false,
    });
  });
});

// 6. Test KneeDiagnosticsForm Component
import KneeDiagnosticsForm from '../components/diagnostics/KneeDiagnosticsForm';

describe('KneeDiagnosticsForm Component Flow', () => {
  const mockClients = [
    {
      id: 'c1',
      full_name: 'Peter Koleno',
      role: 'klient',
      email: 'peter@koleno.sk',
      phone: '+421909888777',
      metadata: { birth_date: '1990-01-01' }
    }
  ];

  it('navigates all steps and submits form successfully', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();

    render(
      <KneeDiagnosticsForm
        selectedClientId="c1"
        creatorId="trainer-1"
        clients={mockClients}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // Step 1: Pre-filled identity and GDPR checkbox
    expect(screen.getByLabelText(/Meno/i)).toHaveValue('Peter');
    expect(screen.getByLabelText(/Priezvisko/i)).toHaveValue('Koleno');
    
    // Check GDPR consent
    fireEvent.click(screen.getByLabelText(/Súhlasím so spracovaním osobných údajov/i));
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 2: Intake History
    fireEvent.change(screen.getByLabelText(/Operačný výkon/i), { target: { value: 'Sutura menisku' } });
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 3: Mobility range Selects
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 4: Mobility file uploads
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 5: Strength file uploads
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 6: Final evaluation
    fireEvent.change(screen.getByLabelText(/Na základe zistených svalových/i), { target: { value: 'Posilnenie hamstringov' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Odoslať/i }));

    expect(onSubmit).toHaveBeenCalled();
  });
});

// 7. Test ShoulderDiagnosticsForm Component
import ShoulderDiagnosticsForm from '../components/diagnostics/ShoulderDiagnosticsForm';

describe('ShoulderDiagnosticsForm Component Flow', () => {
  const mockClients = [
    {
      id: 'c2',
      full_name: 'Marek Rameno',
      role: 'klient',
      email: 'marek@rameno.sk',
      phone: '+421905111222',
      metadata: { birth_date: '1992-05-05' }
    }
  ];

  it('navigates all 5 steps and submits form successfully', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();

    render(
      <ShoulderDiagnosticsForm
        selectedClientId="c2"
        creatorId="trainer-1"
        clients={mockClients}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // Step 1: Pre-filled identity and GDPR checkbox
    expect(screen.getByLabelText(/Meno/i)).toHaveValue('Marek');
    expect(screen.getByLabelText(/Priezvisko/i)).toHaveValue('Rameno');
    
    // Check GDPR consent
    fireEvent.click(screen.getByLabelText(/Súhlasím so spracovaním osobných údajov/i));
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 2: Intake History
    fireEvent.change(screen.getByLabelText(/Operačný výkon/i), { target: { value: 'Sutura rotatorovej manzety' } });
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 3: Mobility range Selects
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 4: Strength file uploads
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 5: Final evaluation
    fireEvent.change(screen.getByLabelText(/Na základe zistených svalových/i), { target: { value: 'Stabilizacia lopatky' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Odoslať/i }));

    expect(onSubmit).toHaveBeenCalled();
  });
});

// 8. Test DeviceLeaseAgreementForm Component
import DeviceLeaseAgreementForm from '../components/diagnostics/DeviceLeaseAgreementForm';

describe('DeviceLeaseAgreementForm Component Flow', () => {
  const mockClients = [
    {
      id: 'c3',
      full_name: 'Jan Najomca',
      role: 'klient',
      email: 'jan@najomca.sk',
      phone: '+421900111222',
      metadata: { birth_date: '1988-08-08', address: 'Lipova 10, Zvolen' }
    }
  ];

  it('completes the 5-step agreement wizard flow and signs successfully', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();

    render(
      <DeviceLeaseAgreementForm
        selectedClientId="c3"
        creatorId="trainer-1"
        clients={mockClients}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // Step 1: Nájomca Identity
    expect(screen.getByLabelText(/Meno a priezvisko/i)).toHaveValue('Jan Najomca');
    expect(screen.getByLabelText(/Trvalý pobyt/i)).toHaveValue('Lipova 10, Zvolen');
    
    // Add passport/OP ID
    fireEvent.change(screen.getByLabelText(/Číslo občianskeho preukazu/i), { target: { value: 'EB987654' } });
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 2: Device selection (default PowerDot)
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 3: Dates & amounts
    fireEvent.change(screen.getByLabelText(/Doba nájmu Od/i), { target: { value: '2026-06-15' } });
    fireEvent.change(screen.getByLabelText(/Doba nájmu Do/i), { target: { value: '2026-06-22' } });
    fireEvent.change(screen.getByLabelText(/Suma \(výška nájomného/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Suma slovom/i), { target: { value: 'jednosto' } });
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 4: Static Legal Text
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // Step 5: Sign & Consent
    fireEvent.change(screen.getByLabelText(/V Bratislave, dňa/i), { target: { value: '2026-06-14' } });
    fireEvent.change(screen.getByLabelText(/Email podpis/i), { target: { value: 'jan@najomca.sk' } });
    
    // Click verify email
    fireEvent.click(screen.getByRole('button', { name: /Overiť email/i }));
    
    // Wait for the verification simulation (1s timeout in code, let's mock timers or wait)
    // To keep the test synchronous and simple without act warnings, let's wait or resolve state
    // Actually, we can use act or vitest fake timers, or since the setTimeout runs inside component,
    // we can use standard findByRole or fire it. Let's wait using findByText.
    const verifiedBtn = await screen.findByRole('button', { name: /Overené ✓/i }, { timeout: 1500 });
    expect(verifiedBtn).toBeInTheDocument();

    // Check consent checkbox
    fireEvent.click(screen.getByLabelText(/Súhlasím so znením zmluvy/i));
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Podpísať a Odoslať/i }));

    expect(onSubmit).toHaveBeenCalled();
  });
});



