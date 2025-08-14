import Airtable from "airtable";

let _base: Airtable.Base | null = null;

export function getBase(): Airtable.Base {
  if (!_base) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey) {
      throw new Error(
        "An API key is required to connect to Airtable. Please set AIRTABLE_API_KEY environment variable."
      );
    }

    if (!baseId) {
      throw new Error(
        "A base ID is required to connect to Airtable. Please set AIRTABLE_BASE_ID environment variable."
      );
    }

    Airtable.configure({
      endpointUrl: "https://api.airtable.com",
      apiKey: apiKey,
    });

    _base = Airtable.base(baseId);
  }

  return _base;
}
