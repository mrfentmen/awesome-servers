import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateYear,
  validateWeek,
  validateSeasonType,
  requireText,
  optionalText,
  buildUrl,
  summarizeGame,
  summarizeGames,
  pollTop,
} from '../dist/util.js';

test('validateYear accepts real seasons and rejects junk', () => {
  assert.equal(validateYear(2025), 2025);
  assert.equal(validateYear(1869), 1869);
  assert.throws(() => validateYear(1850), /plausible season year/);
  assert.throws(() => validateYear('abc'), /plausible season year/);
  assert.equal(validateYear(undefined, false), undefined);
  assert.throws(() => validateYear(undefined, true), /year is required/);
});

test('validateWeek bounds 1-25', () => {
  assert.equal(validateWeek(7), 7);
  assert.equal(validateWeek(undefined), undefined);
  assert.throws(() => validateWeek(0), /between 1 and 25/);
  assert.throws(() => validateWeek(30), /between 1 and 25/);
});

test('validateSeasonType accepts the three CFBD values', () => {
  assert.equal(validateSeasonType('regular'), 'regular');
  assert.equal(validateSeasonType('postseason'), 'postseason');
  assert.equal(validateSeasonType('both'), 'both');
  assert.equal(validateSeasonType(undefined), undefined);
  assert.throws(() => validateSeasonType('spring'), /seasonType must be/);
});

test('requireText and optionalText guard the free-text arguments', () => {
  assert.equal(requireText('  Michigan ', 'team'), 'Michigan');
  assert.throws(() => requireText('', 'team'), /team is required/);
  assert.equal(optionalText('  Ohio State  ', 'team'), 'Ohio State');
  assert.equal(optionalText(undefined, 'team'), undefined);
  assert.throws(() => optionalText('x'.repeat(200), 'team'), /at most 120/);
});

test('buildUrl drops empty params and always appends the authorization key', () => {
  const url = buildUrl(
    'https://api.collegefootballdata.com',
    '/games',
    { year: 2025, week: 3, seasonType: undefined, team: 'Michigan', conference: false },
    'k/ey',
  );
  assert.ok(url.startsWith('https://api.collegefootballdata.com/games?'));
  assert.ok(url.includes('year=2025'));
  assert.ok(url.includes('week=3'));
  assert.ok(url.includes('team=Michigan'));
  assert.ok(!url.includes('seasonType'));
  assert.ok(!url.includes('conference'));
  assert.ok(url.includes(`authorization=${encodeURIComponent('k/ey')}`));
});

test('summarizeGame keeps the fields that answer "what happened"', () => {
  const got = summarizeGame({
    id: 401635549,
    season: 2025,
    week: 1,
    seasonType: 'regular',
    startDate: '2025-08-30T19:00:00.000Z',
    completed: true,
    neutralSite: false,
    homeTeam: 'Michigan',
    homePoints: 30,
    awayTeam: 'New Mexico',
    awayPoints: 27,
    venue: 'Michigan Stadium',
    excitementIndex: 2.4,
  });
  assert.equal(got.gameId, 401635549);
  assert.equal(got.homeTeam, 'Michigan');
  assert.equal(got.excitement, 2.4);
});

test('summarizeGames maps arrays and passes non-arrays through', () => {
  assert.equal(summarizeGames('nope'), 'nope');
  const one = summarizeGames([{ id: 1, homeTeam: 'A' }]);
  assert.equal((one as Array<Record<string, unknown>>)[0].homeTeam, 'A');
});

test('pollTop flattens one poll, filters by name and slices top_n', () => {
  const data = [
    {
      season: 2025,
      seasonType: 'regular',
      week: 5,
      polls: [
        {
          poll: 'AP Top 25',
          ranks: [
            { rank: 1, school: 'Ohio State', conference: 'Big Ten', points: 1525 },
            { rank: 2, school: 'Penn State', conference: 'Big Ten', points: 1500 },
            { rank: 3, school: 'Georgia', conference: 'SEC', points: 1470 },
          ],
        },
        { poll: 'Coaches Poll', ranks: [{ rank: 1, school: 'X' }] },
      ],
    },
  ];
  const ap = pollTop(data, 'ap', 2) as Array<Record<string, unknown>>;
  assert.equal(ap[0].poll, 'AP Top 25');
  assert.equal((ap[0].ranks as unknown[]).length, 2);
  assert.equal((ap[0].ranks as Array<Record<string, unknown>>)[0].school, 'Ohio State');

  const coaches = pollTop(data, 'Coaches', undefined) as Array<Record<string, unknown>>;
  assert.equal(coaches[0].poll, 'Coaches Poll');

  assert.throws(() => pollTop(data, undefined, 0), /top_n must be/);
  assert.throws(() => pollTop(data, undefined, 30), /top_n must be/);
  assert.deepEqual(pollTop([], 'ap', 25), []);
});