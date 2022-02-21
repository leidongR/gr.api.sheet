export type AtomicCondition = {
  fieldKey?: string;
  operator: string;
  fieldValue: number | string | string[] | { field: string; isAsc: boolean }[];
};
export type OrCondition = { [id: string]: AtomicCondition[] };
export type QueryCondition = AtomicCondition | OrCondition;
export const parseConditionsOfQuery = (
  query: NodeJS.Dict<string | string[]>,
  fieldNames: string[],
  lowerCaseFieldNames: string[]
) => {
  const conditions: QueryCondition[] = [];
  const orCondition: OrCondition = {};
  for (const key in query) {
    if (!Object.prototype.hasOwnProperty.call(query, key)) continue;

    const atomicCondition = parseConditionOfQueryItem(
      key,
      query[key],
      fieldNames,
      lowerCaseFieldNames
    );

    if (atomicCondition.orGroupId != null) {
      if (
        Object.prototype.hasOwnProperty.call(
          orCondition,
          atomicCondition.orGroupId
        )
      ) {
        orCondition[atomicCondition.orGroupId].push(atomicCondition.condition);
      } else {
        orCondition[atomicCondition.orGroupId] = [atomicCondition.condition];
      }
    } else {
      conditions.push(atomicCondition.condition);
    }
  }

  if (Object.keys(orCondition).length > 0) {
    conditions.push(orCondition);
  }

  return conditions;
};

const parseOrGroupId = (queryKey: string) => {
  if (!queryKey.startsWith("$or[")) {
    return {
      orGroupId: undefined,
      fieldKey: queryKey,
    };
  }

  const idStart = "$or[".length;
  const idEnd = queryKey.indexOf("]", idStart);
  if (idEnd <= idStart) {
    throw new Error(
      `invalid query key '${queryKey}', suggested format: '$or[1]fieldname=xxx'`
    );
  }

  return {
    orGroupId: queryKey.substring(idStart, idEnd),
    fieldKey: queryKey.substring(idEnd + 1),
  };
};

const verifyField = (
  field: string,
  fieldNames: string[],
  lowerCaseFieldNames: string[]
) => {
  const index = lowerCaseFieldNames.indexOf(field);
  if (index < 0) {
    throw new Error(`field '${field}' not exists in this sheet`);
  }
  return fieldNames[index];
};

const buildAtomicCondition = (
  orGroupId: string,
  queryKey: string,
  value: string | string[],
  fieldNames: string[],
  lowerCaseFieldNames: string[]
): AtomicCondition => {
  const operatorStart = queryKey.lastIndexOf("$");

  // case 1: operator =
  if (operatorStart < 0) {
    return {
      fieldKey: verifyField(queryKey, fieldNames, lowerCaseFieldNames),
      operator: "=",
      fieldValue: value,
    };
  }

  const operator = queryKey.substring(operatorStart);

  // case 2: row filter operators by compare field value
  if (
    ["$lt", "$lte", "$gt", "$gte", "$ne", "$like", "$in", "$nin"].includes(
      operator
    )
  ) {
    return {
      fieldKey: queryKey.substring(0, operatorStart),

      operator,
      fieldValue: value,
    };
  }

  if (orGroupId != null) {
    throw new Error(`unsupported operator '${operator}' combin with $or`);
  }

  // case 3: pick columns of results
  if (["$select", "$deselect"].includes(operator)) {
    return {
      fieldKey: queryKey.substring(0, operatorStart),

      operator,
      fieldValue: (typeof value === "string" ? [value] : value).map((field) =>
        verifyField(field, fieldNames, lowerCaseFieldNames)
      ),
    };
  }

  // case 4: pick rows of results
  if (["$skip", "$limit"].includes(operator)) {
    if (typeof value !== "string") {
      throw new Error(`operator '${operator}' are duplicated`);
    }
    if (queryKey !== operator) {
      const uselessPrefix = queryKey.substring(0, operatorStart);
      throw new Error(`operator '${operator}' should has no prefix`);
    }

    try {
      if (/^-?\d+$/.test(value)) {
        const int = parseInt(value);
        return {
          operator,
          fieldValue: int,
        };
      }
      throw new Error("invalid format");
    } catch (error) {
      throw new Error(`operator '${operator}' has non-integer value'${value}'`);
    }
  }

  // case 5: sort results
  if (["$sort"].includes(operator)) {
    if (queryKey !== operator) {
      const uselessPrefix = queryKey.substring(0, operatorStart);
      throw new Error(`operator '${operator}' should has no prefix`);
    }

    const fieldAndSortArray: { field: string; isAsc: boolean }[] = (
      typeof value === "string" ? [value] : value
    ).map((item) => {
      try {
        const field = verifyField(item, fieldNames, lowerCaseFieldNames);
        return { field, isAsc: true };
      } catch (error) {
        const isAsc = item.startsWith("+")
          ? true
          : item.startsWith("-")
          ? false
          : undefined;
        if (isAsc == null) {
          throw error;
        } else {
          const field = verifyField(
            item.substring(1),
            fieldNames,
            lowerCaseFieldNames
          );
          return { field, isAsc };
        }
      }
    });

    return {
      operator,
      fieldValue: fieldAndSortArray,
    };
  } else {
    throw new Error(`unsupported operator '${operator}'`);
  }
};

const parseConditionOfQueryItem = (
  queryKey: string,
  value: string | string[],
  fieldNames: string[],
  lowerCaseFieldNames: string[]
) => {
  try {
    const { orGroupId, fieldKey } = parseOrGroupId(queryKey);
    return {
      orGroupId,
      condition: buildAtomicCondition(
        orGroupId,
        fieldKey,
        value,
        fieldNames,
        lowerCaseFieldNames
      ),
    };
  } catch (error) {
    const itemDesc = (typeof value === "string" ? [value] : value)
      .map((v) => `${queryKey}=${v}`)
      .join("&");

    var rawErrDesc = `${error}`;
    if (rawErrDesc.startsWith("Error: ")) {
      rawErrDesc = rawErrDesc.substring("Error: ".length);
    }

    throw new Error(`${rawErrDesc} when parse query item '${itemDesc}'`);
  }
};
