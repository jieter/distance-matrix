/** @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { URLSerializer } from './state.svelte'; // Adjust path

describe('URLSerializer', () => {
    const mockLocations = [
        {
            name: 'London',
            lat: 51.5074,
            lng: -0.1278,
            color: '#e6194B',
            isAutoNamed: false,
        },
        {
            name: 'Paris',
            lat: 48.8566,
            lng: 2.3522,
            color: '#3cb44b0',
            isAutoNamed: true,
        },
    ];

    const mockDisabledLegs = new Set(['1-2']);

    describe('serialize', () => {
        it('should correctly serialize locations and disabled legs', () => {
            const result = URLSerializer.serialize(mockLocations as any, mockDisabledLegs);

            expect(result).toBe('London;51.5074;-0.1278;0_*Paris;48.8566;2.3522;0_~1-2');
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
            const { locations, disabledLegs } = URLSerializer.deserialize(serialized);

            expect(locations).toEqual([
                {
                    name: 'New York',
                    lat: 40.7128,
                    lng: -74.006,
                    color: '#ffe119',
                    loading: false,
                    marker: null,
                    isAutoNamed: false,
                },
            ]);
            expect(disabledLegs).toEqual(new Set(['leg-1']));
        });

        it('should handle the auto-named prefix (*)', () => {
            const serialized = '*AutoCity;10;20;0';
            const { locations } = URLSerializer.deserialize(serialized);
            expect(locations[0].isAutoNamed).toBe(true);
            expect(locations[0].name).toBe('AutoCity');
        });

        it('should return empty values for an empty string', () => {
            const { locations, disabledLegs } = URLSerializer.deserialize('');
            expect(locations).toEqual([]);
            expect(disabledLegs.size).toBe(0);
        });
    });

    describe('Round-trip Consistency', () => {
        it('should result in the same data after serializing and deserializing', () => {
            const serialized = URLSerializer.serialize(mockLocations as any, mockDisabledLegs);
            const deserialized = URLSerializer.deserialize(serialized);

            expect(deserialized.locations[0].name).toBe(mockLocations[0].name);
            expect(deserialized.locations[1].isAutoNamed).toBe(true);
            expect(deserialized.disabledLegs).toEqual(mockDisabledLegs);
        });
    });

    describe('fromHash', () => {
        it('should read from window.location.hash', () => {
            // Mock window.location
            vi.stubGlobal('location', { hash: '#Test;1;2;0' });

            const { locations } = URLSerializer.fromHash();
            expect(locations[0].name).toBe('Test');
        });
    });
});
