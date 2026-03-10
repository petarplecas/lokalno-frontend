# Frontend Testing Guide

## Framework

Jest 30 + jest-preset-angular. Zoneless Angular environment (jsdom).

## Kada pisati koji tip testa

| Šta dodaješ | Tip testa |
|-------------|-----------|
| Nova service metoda | Unit test u spec.ts pored fajla |
| Nova komponenta sa logikom | Unit test u spec.ts pored fajla |
| Novi pipe | Unit test (direktna instanca, bez TestBed) |
| Novi guard | Unit test sa mock Router/AuthService |
| Novi interceptor | Unit test sa HttpTestingController |
| Novi korisnički tok kroz UI (login→akcija) | Playwright E2E (kada se doda) |

## Unit Test Pravila

### Struktura fajla

```typescript
describe('ClassName', () => {
  let service: ClassName; // ili component/pipe/guard

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        ClassName,
        { provide: SomeDependency, useValue: mockDependency },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    service = TestBed.inject(ClassName);
  });

  afterEach(() => {
    httpMock.verify(); // samo kada se koristi HttpTestingController
  });

  describe('methodName', () => {
    it('should ...', () => { ... });
  });
});
```

### Helper factory funkcije za test data

Uvek koristiti factory funkcije umesto inline objekata:

```typescript
function baseDiscount(overrides: Partial<Discount> = {}): Discount {
  return {
    id: '1',
    title: 'Test popust',
    discountValue: 20,
    discountType: 'PERCENTAGE',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    ...overrides,
  };
}
```

### Mocking

- **HTTP pozivi**: `HttpTestingController` — nikad pravi HTTP zahtevi
- **Servisi**: `jest.fn()` objekti kao `useValue` u TestBed
- **Signali**: direktno setovanje kroz mock servis
- **Eksterni moduli** (mapbox, geocoder): `moduleNameMapper` u `jest.config.js` — ne menjati

### Servisi — HttpTestingController pattern

```typescript
it('should login', () => {
  let result: AuthResponse | undefined;

  service.login(credentials).subscribe(r => (result = r));

  const req = httpMock.expectOne(`${apiUrl}/auth/login`);
  expect(req.request.method).toBe('POST');
  expect(req.request.withCredentials).toBe(true); // za auth endpoint-e
  req.flush({ user: mockUser, accessToken: 'token' });

  expect(service.currentUser()).toEqual(mockUser);
});
```

### Komponente

```typescript
it('should emit event on click', () => {
  const emitted: SaveEvent[] = [];
  fixture.componentInstance.saveToggled.subscribe(e => emitted.push(e));

  const btn = fixture.nativeElement.querySelector('[data-testid="save-btn"]');
  btn.click();
  fixture.detectChanges();

  expect(emitted[0].saved).toBe(true);
});
```

- Testirati DOM ponašanje (klikovi, form submit) — ne privatne metode
- Testirati computed signals i njihove efekte na template
- Testirati CSS klase za različita stanja (`--active`, `--disabled`)
- Koristiti `fixture.detectChanges()` nakon promene signala

### Interceptori

Testirati:
- Dodavanje `Authorization: Bearer` headera za zaštićene endpointe
- Isključivanje auth endpointa (`/auth/*`) iz interceptora
- 401 → refresh → retry tok

### Guards

```typescript
const mockRouter = { navigate: jest.fn() } as unknown as Router;
const mockAuthService = { isLoggedIn: signal(false) };

// allow za ispravnu rolu
// redirect za pogrešnu rolu — proveri mockRouter.navigate poziv
```

## Coverage

Cilj: **>75% lines/functions/branches** na business logici.

Fokus na:
- Service metode (API pozivi, state transformacije)
- Guard logika
- Interceptor tokovi
- Computed signals i edge case-ovi

Ne treba pokriti: trivijalni template rendering, statičke property definicije.

## Pokretanje

```bash
npm test                      # Watch mode
npm test -- --ci --coverage   # CI mode sa coverage izveštajem
```
