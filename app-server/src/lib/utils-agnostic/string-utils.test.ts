import {
  findInStringWithContext,
  findInStringWithContextMulti,
} from "./string-utils";

describe("findInStringWithContextMulti", () => {
  test("multiple queries both match, merges overlapping context", () => {
    const str = "Checkout time is 11am. Check-out is at noon.";
    const result = findInStringWithContextMulti(str, ["Checkout", "Check-out"], 5);
    expect(result).toContain("Checkout");
    expect(result).toContain("Check-out");
    expect(result).not.toBe(str);
  });

  test("multiple queries one matches, returns only matching region", () => {
    const str = "The quick brown fox jumps";
    const result = findInStringWithContextMulti(str, ["xyz", "brown"], 4);
    expect(result).toBe("ick brown fox");
  });

  test("empty queries array returns full string", () => {
    const str = "Hello world";
    expect(findInStringWithContextMulti(str, [], 5)).toBe("Hello world");
  });

  test("single query same behavior as findInStringWithContext", () => {
    const str = "The quick brown fox jumps";
    expect(findInStringWithContextMulti(str, ["brown"], 4)).toBe(
      findInStringWithContext(str, "brown", 4),
    );
  });
});

describe("findInStringWithContext", () => {
  test("returns all matches with context, merging overlapping segments", () => {
    const str =
      "Here is my full string full and some more tet that will be cut out and a final full to show how this works";
    const result = findInStringWithContext(str, "full", 10);
    expect(result).toBe("ere is my full string full and some... d a final full to show h");
  });

  test("returns full string when query not found", () => {
    const str = "Hello world";
    expect(findInStringWithContext(str, "xyz", 5)).toBe("Hello world");
  });

  test("single match returns one chunk with context", () => {
    const str = "The quick brown fox jumps";
    expect(findInStringWithContext(str, "brown", 4)).toBe("ick brown fox");
  });

  test("adjacent matches merge into one chunk", () => {
    const str = "aaaa";
    expect(findInStringWithContext(str, "a", 1)).toBe("aaaa");
  });

  test("non-overlapping matches are separated by ... ", () => {
    const str = "foo bar baz foo bar";
    const result = findInStringWithContext(str, "foo", 2);
    expect(result).toBe("foo b... z foo b");
  });

  test("empty query returns full string", () => {
    const str = "hello";
    expect(findInStringWithContext(str, "", 5)).toBe("hello");
  });

  test("contextLength 0 still includes query", () => {
    const str = "abc def ghi";
    expect(findInStringWithContext(str, "def", 0)).toBe("def");
  });
});
