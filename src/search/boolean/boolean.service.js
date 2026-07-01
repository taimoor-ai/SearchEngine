// search/boolean/boolean.service.js

class BooleanService {
  /**
   * AND operation
   * Returns only documents present in every set.
   */
  and(documentSets = []) {
    if (!documentSets.length) {
      return new Set();
    }

    if (documentSets.length === 1) {
      return new Set(documentSets[0]);
    }

    const sorted = [...documentSets].sort(
      (a, b) => a.size - b.size
    );

    const result = new Set();

    for (const docId of sorted[0]) {
      let existsInAll = true;

      for (let i = 1; i < sorted.length; i++) {
        if (!sorted[i].has(docId)) {
          existsInAll = false;
          break;
        }
      }

      if (existsInAll) {
        result.add(docId);
      }
    }

    return result;
  }

  /**
   * OR operation
   * Returns every unique document.
   */
  or(documentSets = []) {
    const result = new Set();

    for (const set of documentSets) {
      for (const docId of set) {
        result.add(docId);
      }
    }

    return result;
  }

  /**
   * NOT operation
   * Removes excluded documents.
   */
  not(includeSet = new Set(), excludeSet = new Set()) {
    const result = new Set(includeSet);

    for (const docId of excludeSet) {
      result.delete(docId);
    }

    return result;
  }

  /**
   * Difference
   * Alias for NOT.
   */
  difference(a = new Set(), b = new Set()) {
    return this.not(a, b);
  }

  /**
   * Intersection
   * Alias for AND.
   */
  intersection(a = new Set(), b = new Set()) {
    return this.and([a, b]);
  }

  /**
   * Union
   * Alias for OR.
   */
  union(a = new Set(), b = new Set()) {
    return this.or([a, b]);
  }

  /**
   * Convert postings into a document ID set.
   */
  postingToSet(postings = []) {
    const result = new Set();

    for (const posting of postings) {
      result.add(posting.pageId.toString());
    }

    return result;
  }

  /**
   * Build a lookup map from term -> Set(pageIds)
   */
  buildPostingMap(indexDocs = []) {
    const map = new Map();

    for (const doc of indexDocs) {
      map.set(
        doc.term,
        this.postingToSet(doc.postings)
      );
    }

    return map;
  }

  /**
   * Returns an empty Set if the term doesn't exist.
   */
  getPosting(postingMap, term) {
    return postingMap.get(term) || new Set();
  }
}

export default new BooleanService();