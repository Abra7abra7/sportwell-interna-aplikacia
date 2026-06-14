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

// 2. Test PDF Generation Helper
import { generateGdprPdf } from '../utils/pdfGenerator';
import { jsPDF } from 'jspdf';

describe('GDPR PDF Generator', () => {
  it('correctly maps client profile metadata into jsPDF instructions', () => {
    const mockProfile = {
      full_name: 'Marek Stancik',
      email: 'marek@sportwell.sk',
      phone: '+421900123456',
      gdpr_signed_at: '2026-06-14T10:00:00Z',
      metadata: {
        gdpr_version: 'v3.0',
      },
    };

    const doc = generateGdprPdf(mockProfile);
    expect(doc.text).toHaveBeenCalledWith(expect.stringContaining('Marek Stancik'), expect.any(Number), expect.any(Number));
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
    fireEvent.change(screen.getByLabelText(/Trvalý pobyt \/ Adresa/i), { target: { value: 'Mlynska 5, Kosice' } });
    fireEvent.change(screen.getByLabelText(/Kontaktný e-mail/i), { target: { value: 'klient@sportwell.sk' } });

    // Submit step 1
    fireEvent.submit(screen.getByRole('button', { name: /Pokračovať na súhlasy/i }));

    // STEP 2: REQUIRED CONSENTS
    // Expect terms and privacy warning/checkboxes
    const privacyCheckbox = screen.getByLabelText(/Súhlasím so spracovaním citlivých zdravotných údajov/i);
    const termsCheckbox = screen.getByLabelText(/Súhlasím s podmienkami a VOP/i);

    expect(screen.getByRole('button', { name: /Pokračovať/i })).toBeDisabled();
    
    // Check both
    fireEvent.click(privacyCheckbox);
    fireEvent.click(termsCheckbox);
    expect(screen.getByRole('button', { name: /Pokračovať/i })).toBeEnabled();

    // Submit step 2
    fireEvent.click(screen.getByRole('button', { name: /Pokračovať/i }));

    // STEP 3: OPTIONAL CONSENTS & SIGN
    fireEvent.submit(screen.getByRole('button', { name: /Dokončiť registráciu/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      firstName: 'Jozef',
      lastName: 'Mrkva',
      birthDate: '1995-10-10',
      address: 'Mlynska 5, Kosice',
      email: 'klient@sportwell.sk',
      phone: '+421901000222',
      primaryInterest: 'Fyzioterapia',
      marketingAccepted: false,
      metaAccepted: false,
      diagAccepted: false,
    });
  });
});
