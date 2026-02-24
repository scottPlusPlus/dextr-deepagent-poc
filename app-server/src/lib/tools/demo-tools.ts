import { DateAsNums, parseDateUnstructured } from "../utils-agnostic/date-utils";

export function getCurrentTime(): string {
    return new Date().toISOString();
}

export function getWordOfTheDay(): string {
    return 'pikachu';
}


export type ResultOrHumanErr<T> = { success: true, data: T } | { success: false, err: string }

export async function queryHotelAvailability(agentId: string, date: string, partySize: number): Promise<ResultOrHumanErr<Array<RoomAndPrice>>> {
    const hotelId = agentId;
    const parsedDate = parseDateUnstructured(date);
    if (!parsedDate) {
        return { success: false, err: "could not parse the desired date" };
    }
    const rooms = await queryAvailabilityImpl(hotelId, parsedDate, partySize);
    return { success: true, data: rooms };
}


type RoomAndPrice = { roomType: string, priceUsd: number };
export async function queryAvailabilityImpl(hotelId: string, date: DateAsNums, partySize: number): Promise<Array<RoomAndPrice>> {
    console.log(`queryAvailabilityImpl: ${date.month}.${date.date}`);
    if (date.date % 10 === 3) {
        return [];
    }
    const res: Array<RoomAndPrice> = [
        { roomType: "standard room", priceUsd: 12.34 }
    ];
    return res;
}