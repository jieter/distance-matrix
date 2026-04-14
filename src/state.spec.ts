/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { URLSerializer, distance, marineState } from './state.svelte';

describe('URLSerializer', () => {
    const mockMarks = [
        {
            name: 'London',
            lat: 51.5074,
            lng: -0.1278,
            color: '#e6194b',
            isAutoNamed: false,
        },
        {
            name: 'Paris',
            lat: 48.8566,
            lng: 2.3522,
            color: '#3cb44b',
            isAutoNamed: true,
        },
    ];

    const mockDisabledLegs = new Set(['1-2']);

    describe('serialize', () => {
        it('should correctly serialize marks and disabled legs', () => {
            const result = URLSerializer.serialize(mockMarks as any, mockDisabledLegs);

            expect(result).toBe('London;51.5074;-0.1278;0_*Paris;48.8566;2.3522;1_~1-2');
        });

        it('should handle special characters in names', () => {
            const loc = [{ name: 'A & B', lat: 0, lng: 0, color: '#FF0000', isAutoNamed: false }];
            const result = URLSerializer.serialize(loc as any, new Set());
            expect(result).toContain('A%20%26%20B');
        });
    });

    describe('deserialize', () => {
        it('should reconstruct the state from a serialized string', () => {
            const serialized = 'New York;40.7128;-74.0060;2_~leg-1';
            const { marks: marks, disabledLegs } = URLSerializer.deserialize(serialized);

            expect(marks).toEqual([
                {
                    name: 'New York',
                    lat: 40.7128,
                    lng: -74.006,
                    color: '#ffe119',
                    loading: false,
                    isAutoNamed: false,
                },
            ]);
            expect(disabledLegs).toEqual(new Set(['leg-1']));
        });

        it('should handle the auto-named prefix (*)', () => {
            const serialized = '*AutoCity;10;20;0';
            const { marks: marks } = URLSerializer.deserialize(serialized);
            expect(marks[0].isAutoNamed).toBe(true);
            expect(marks[0].name).toBe('AutoCity');
        });

        it('should return empty values for an empty string', () => {
            const { marks: locations, disabledLegs } = URLSerializer.deserialize('');
            expect(locations).toEqual([]);
            expect(disabledLegs.size).toBe(0);
        });
    });

    describe('Round-trip Consistency', () => {
        it('should result in the same data after serializing and deserializing', () => {
            const serialized = URLSerializer.serialize(mockMarks as any, mockDisabledLegs);
            const deserialized = URLSerializer.deserialize(serialized);

            expect(deserialized.marks[0].name).toBe(mockMarks[0].name);
            expect(deserialized.marks[1].isAutoNamed).toBe(true);
            expect(deserialized.disabledLegs).toEqual(mockDisabledLegs);
        });
    });

    describe('fromHash', () => {
        it('Should read from window.location.hash', () => {
            // Mock window.location
            vi.stubGlobal('location', { hash: '#Test;1;2;0' });

            const { marks } = URLSerializer.fromHash();
            expect(marks[0].name).toBe('Test');
        });
    });
});

describe('distance', () => {
    it('returns 0 for identical coordinates', () => {
        expect(distance({ lat: 52, lng: 4 }, { lat: 52, lng: 4 })).toBe(0);
    });

    it('calculates nautical miles between IJmuiden and Lowestoft (~103 nm)', () => {
        const ijmuiden = { lat: 52.4633, lng: 4.5722 };
        const lowestoft = { lat: 52.4833, lng: 1.75 };
        expect(distance(ijmuiden, lowestoft)).toBeCloseTo(103, -1);
    });

    it('is symmetric (A→B equals B→A)', () => {
        const a = { lat: 51.5, lng: -0.12 };
        const b = { lat: 48.85, lng: 2.35 };
        expect(distance(a, b)).toBe(distance(b, a));
    });
});

describe('MarineState', () => {
    beforeEach(() => {
        marineState.clearAll();
        marineState.disabledLegs = new Set();
        vi.restoreAllMocks();
    });

    describe('mark lifecycle', () => {
        it('addMark appends a mark with the given coordinates', () => {
            marineState.addMark({ lat: 52.0, lng: 4.0 });
            expect(marineState.marks).toHaveLength(1);
            expect(marineState.marks[0].lat).toBe(52.0);
            expect(marineState.marks[0].lng).toBe(4.0);
        });

        it('addMark assigns unique colors to consecutive marks', () => {
            marineState.addMark({ lat: 0, lng: 0 });
            marineState.addMark({ lat: 1, lng: 1 });
            expect(marineState.marks[0].color).not.toBe(marineState.marks[1].color);
        });

        it('removeMark removes the correct mark by index', () => {
            marineState.addMark({ lat: 0, lng: 0 });
            marineState.addMark({ lat: 1, lng: 1 });
            const secondColor = marineState.marks[1].color;
            marineState.removeMark(0);
            expect(marineState.marks).toHaveLength(1);
            expect(marineState.marks[0].color).toBe(secondColor);
        });

        it('updateMarkPosition updates lat/lng in place', () => {
            marineState.addMark({ lat: 0, lng: 0 });
            marineState.updateMarkPosition(0, { lat: 10, lng: 20 } as any);
            expect(marineState.marks[0].lat).toBe(10);
            expect(marineState.marks[0].lng).toBe(20);
        });
    });

    describe('leg management', () => {
        it('toggleLeg disables a leg', () => {
            marineState.toggleLeg(0, 1);
            expect(marineState.isLegDisabled(0, 1)).toBe(true);
        });

        it('toggleLeg re-enables a disabled leg', () => {
            marineState.toggleLeg(0, 1);
            marineState.toggleLeg(0, 1);
            expect(marineState.isLegDisabled(0, 1)).toBe(false);
        });

        it('isLegDisabled is order-independent (i,j same as j,i)', () => {
            marineState.toggleLeg(1, 3);
            expect(marineState.isLegDisabled(3, 1)).toBe(true);
        });
    });

    describe('hover', () => {
        it('setHover with one index sets single highlight', () => {
            marineState.setHover(2);
            expect(marineState.hoveredIndices).toEqual([2]);
        });

        it('setHover with two indices sets cell highlight', () => {
            marineState.setHover(1, 3);
            expect(marineState.hoveredIndices).toEqual([1, 3]);
        });

        it('clearHover empties hoveredIndices', () => {
            marineState.setHover(0);
            marineState.clearHover();
            expect(marineState.hoveredIndices).toEqual([]);
        });
    });

    describe('reverseGeocode', () => {
        it('sets mark name from city field', async () => {
            vi.stubGlobal('fetch', async () => ({
                json: async () => ({ address: { city: 'Amsterdam' } }),
            }));
            marineState.addMark({ lat: 52.37, lng: 4.89 });
            await marineState.reverseGeocode(0);
            expect(marineState.marks[0].name).toBe('Amsterdam');
        });

        it('falls back to water when city is absent', async () => {
            vi.stubGlobal('fetch', async () => ({
                json: async () => ({ address: { water: 'North Sea' } }),
            }));
            marineState.addMark({ lat: 55, lng: 3 });
            await marineState.reverseGeocode(0);
            expect(marineState.marks[0].name).toBe('North Sea');
        });

        it('keeps original name on fetch error', async () => {
            vi.stubGlobal('fetch', async () => {
                throw new Error('network');
            });
            marineState.addMark({ lat: 0, lng: 0 });
            const original = marineState.marks[0].name;
            await marineState.reverseGeocode(0);
            expect(marineState.marks[0].name).toBe(original);
        });
    });
});
