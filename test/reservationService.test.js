const {
  checkReservationOverlap,
  checkBulkReservationOverlap,
  createReservation,
  createBulkReservations,
  getProduktsMedEjer,
  groupProdukterByEjer
} = require('../service/reservationService');
const prisma = require('../database/prisma');

// Mock Prisma
jest.mock('../database/prisma', () => ({
  reservationer: {
    findMany: jest.fn(),
    create: jest.fn()
  },
  produkter: {
    findMany: jest.fn()
  }
}));

describe('ReservationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkReservationOverlap', () => {
    it('should return hasOverlap=true when there are overlapping reservations', async () => {
      const mockReservations = [
        {
          id: 1,
          bruger: 'Test Bruger',
          teaternavn: 'Test Teater',
          fra_dato: new Date('2025-01-10'),
          til_dato: new Date('2025-01-15')
        }
      ];

      prisma.reservationer.findMany.mockResolvedValue(mockReservations);

      const result = await checkReservationOverlap(1, '2025-01-12', '2025-01-18');

      expect(result.hasOverlap).toBe(true);
      expect(result.overlappingReservations).toHaveLength(1);
      expect(prisma.reservationer.findMany).toHaveBeenCalledWith({
        where: {
          produkt_id: 1,
          AND: [
            { fra_dato: { lte: new Date('2025-01-18') } },
            { til_dato: { gte: new Date('2025-01-12') } }
          ]
        },
        select: {
          id: true,
          bruger: true,
          teaternavn: true,
          fra_dato: true,
          til_dato: true
        }
      });
    });

    it('should return hasOverlap=false when there are no overlapping reservations', async () => {
      prisma.reservationer.findMany.mockResolvedValue([]);

      const result = await checkReservationOverlap(1, '2025-01-20', '2025-01-25');

      expect(result.hasOverlap).toBe(false);
      expect(result.overlappingReservations).toHaveLength(0);
    });
  });

  describe('checkBulkReservationOverlap', () => {
    it('should return conflicts grouped by product when overlaps exist', async () => {
      const mockReservations = [
        {
          id: 1,
          produkt_id: 10,
          teaternavn: 'Teater A',
          fra_dato: new Date('2025-01-10'),
          til_dato: new Date('2025-01-15'),
          produkt: { id: 10, navn: 'Lampe' }
        },
        {
          id: 2,
          produkt_id: 10,
          teaternavn: 'Teater B',
          fra_dato: new Date('2025-01-16'),
          til_dato: new Date('2025-01-20'),
          produkt: { id: 10, navn: 'Lampe' }
        }
      ];

      prisma.reservationer.findMany.mockResolvedValue(mockReservations);

      const result = await checkBulkReservationOverlap([10, 20], '2025-01-12', '2025-01-18');

      expect(result.hasOverlap).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].produktId).toBe(10);
      expect(result.conflicts[0].produktNavn).toBe('Lampe');
      expect(result.conflicts[0].reservationer).toHaveLength(2);
    });

    it('should return hasOverlap=false when no conflicts exist', async () => {
      prisma.reservationer.findMany.mockResolvedValue([]);

      const result = await checkBulkReservationOverlap([10, 20], '2025-01-20', '2025-01-25');

      expect(result.hasOverlap).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('createReservation', () => {
    it('should create a single reservation with correct data', async () => {
      const mockReservation = {
        id: 1,
        bruger: 'Test Bruger',
        teaternavn: 'Test Teater',
        laaner_id: 5,
        fra_dato: new Date('2025-01-10'),
        til_dato: new Date('2025-01-15'),
        produkt_id: 10
      };

      prisma.reservationer.create.mockResolvedValue(mockReservation);

      const result = await createReservation({
        produktId: 10,
        laanerId: 5,
        bruger: 'Test Bruger',
        teaternavn: 'Test Teater',
        startDato: '2025-01-10',
        slutDato: '2025-01-15'
      });

      expect(result).toEqual(mockReservation);
      expect(prisma.reservationer.create).toHaveBeenCalledWith({
        data: {
          bruger: 'Test Bruger',
          teaternavn: 'Test Teater',
          laaner_id: 5,
          fra_dato: new Date('2025-01-10'),
          til_dato: new Date('2025-01-15'),
          produkt_id: 10
        }
      });
    });
  });

  describe('createBulkReservations', () => {
    it('should create multiple reservations', async () => {
      const mockReservation = {
        id: 1,
        bruger: 'Test Bruger',
        teaternavn: 'Test Teater',
        laaner_id: 5,
        fra_dato: new Date('2025-01-10'),
        til_dato: new Date('2025-01-15')
      };

      prisma.reservationer.create.mockResolvedValue(mockReservation);

      const result = await createBulkReservations(
        [10, 20, 30],
        5,
        'Test Bruger',
        'Test Teater',
        '2025-01-10',
        '2025-01-15'
      );

      expect(result).toHaveLength(3);
      expect(prisma.reservationer.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('getProduktsMedEjer', () => {
    it('should fetch products with owner information', async () => {
      const mockProdukter = [
        {
          id: 10,
          navn: 'Lampe',
          ejer: {
            id: 1,
            navn: 'Ejer Navn',
            teaternavn: 'Teater X',
            email: 'ejer@test.dk'
          }
        }
      ];

      prisma.produkter.findMany.mockResolvedValue(mockProdukter);

      const result = await getProduktsMedEjer([10, 20]);

      expect(result).toEqual(mockProdukter);
      expect(prisma.produkter.findMany).toHaveBeenCalledWith({
        where: { id: { in: [10, 20] } },
        include: {
          ejer: {
            select: { id: true, navn: true, teaternavn: true, email: true }
          }
        }
      });
    });
  });

  describe('groupProdukterByEjer', () => {
    it('should group products by owner ID', () => {
      const produkter = [
        {
          id: 10,
          navn: 'Lampe',
          billede_url: '/img/lampe.jpg',
          ejer: { id: 1, navn: 'Ejer A', teaternavn: 'Teater A', email: 'a@test.dk' }
        },
        {
          id: 20,
          navn: 'Stol',
          billede_url: '/img/stol.jpg',
          ejer: { id: 1, navn: 'Ejer A', teaternavn: 'Teater A', email: 'a@test.dk' }
        },
        {
          id: 30,
          navn: 'Bord',
          billede_url: '/img/bord.jpg',
          ejer: { id: 2, navn: 'Ejer B', teaternavn: 'Teater B', email: 'b@test.dk' }
        }
      ];

      const result = groupProdukterByEjer(produkter);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result[1].produkter).toHaveLength(2);
      expect(result[2].produkter).toHaveLength(1);
      expect(result[1].ejer.navn).toBe('Ejer A');
      expect(result[2].ejer.navn).toBe('Ejer B');
    });

    it('should return empty object for empty product list', () => {
      const result = groupProdukterByEjer([]);
      expect(result).toEqual({});
    });
  });
});
