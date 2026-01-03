// Mock Resend
const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend
    }
  }))
}));

process.env.MAILAPI_KEY = 'test-api-key';

const {
  sendPasswordResetEmail,
  sendReservationNotifikation,
  sendReservationBekraeftelse
} = require('../service/mail');

describe('Mail Service', () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockSend.mockResolvedValue({
      data: { id: 'test-email-id' },
      error: null
    });
  });

  it('should send password reset email', async () => {
    await sendPasswordResetEmail('test@test.dk', 'token123', 'http://localhost:3000');
    
    expect(mockSend).toHaveBeenCalled();
    const args = mockSend.mock.calls[0][0];
    expect(args.to).toContain('test@test.dk');
    expect(args.subject).toContain('Nulstil');
  });

  it('should send reservation notification', async () => {
    await sendReservationNotifikation({
      ejerEmail: 'owner@test.dk',
      ejerNavn: 'Test Ejer',
      reserveretAf: 'Låner',
      teaterNavn: 'Test Teater',
      produkter: [{ navn: 'Lampe' }],
      fraDato: '2025-01-10',
      tilDato: '2025-01-15',
      baseUrl: 'http://localhost:3000'
    });
    
    expect(mockSend).toHaveBeenCalled();
    const args = mockSend.mock.calls[0][0];
    expect(args.to).toContain('owner@test.dk');
  });

  it('should send reservation confirmation', async () => {
    await sendReservationBekraeftelse({
      brugerEmail: 'user@test.dk',
      brugerNavn: 'Test User',
      produkter: [
        { navn: 'Lampe', ejerNavn: 'Odense Teater' },
        { navn: 'Stol', ejerNavn: 'Aarhus Teater' }
      ],
      fraDato: '2025-03-01',
      tilDato: '2025-03-10',
      baseUrl: 'http://localhost:3000'
    });
    
    expect(mockSend).toHaveBeenCalled();
    const args = mockSend.mock.calls[0][0];
    expect(args.to).toContain('user@test.dk');
  });
});