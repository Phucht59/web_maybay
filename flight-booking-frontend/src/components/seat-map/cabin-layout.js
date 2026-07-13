const CABIN_WEIGHTS = {
    first: 1.35,
    business: 1.18,
    economy: 1,
};

const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

function columnRank(column) {
    return String(column)
        .split("")
        .reduce(
            (value, char) =>
                value * 26 + char.charCodeAt(0) - 64,
            0,
        );
}

export function seatColumn(seat) {
    return (
        String(seat?.soGhe || "")
            .match(/^\d+([A-Z]+)$/i)?.[1]
            ?.toUpperCase() || ""
    );
}

export function getExpectedColumns(rows) {
    return [
        ...new Set(
            rows.flatMap(({ seats }) =>
                seats
                    .map(seatColumn)
                    .filter(Boolean),
            ),
        ),
    ].sort(
        (a, b) =>
            columnRank(a) - columnRank(b),
    );
}

export function inferSeatGroups(
    expectedColumns,
) {
    const count = expectedColumns.length;

    if (!count) return [];

    const patterns = {
        1: [1],
        2: [1, 1],
        3: [1, 2],
        4: [2, 2],
        5: [2, 3],
        6: [3, 3],
        7: [2, 3, 2],
        8: [3, 2, 3],
        9: [3, 3, 3],
        10: [3, 4, 3],
    };

    const sizes =
        patterns[count] ||
        (() => {
            const middle = Math.ceil(count / 3);
            const left = Math.floor(
                (count - middle) / 2,
            );

            return [
                left,
                middle,
                count - left - middle,
            ].filter(Boolean);
        })();

    let cursor = 0;

    return sizes.map((size) => {
        const group = expectedColumns.slice(
            cursor,
            cursor + size,
        );

        cursor += size;
        return group;
    });
}

function buildTracks(
    columnGroups,
    slotWidth,
    aisleWidth,
) {
    const tracks = [];

    columnGroups.forEach(
        (group, index) => {
            if (index > 0) {
                tracks.push({
                    type: "aisle",
                    key: `aisle-${index - 1}`,
                    width: aisleWidth,
                });
            }

            tracks.push({
                type: "group",
                key: `group-${index}`,
                group,
                groupIndex: index,

                // Mỗi cột có một slot bằng nhau.
                width: group.length * slotWidth,
            });
        },
    );

    // Trường hợp chỉ có một cụm ghế:
    // chừa một track bên cạnh để hiện số hàng.
    if (columnGroups.length === 1) {
        tracks.push({
            type: "aisle",
            key: "row-marker",
            width: aisleWidth,
        });
    }

    return tracks;
}

/**
 * Overview và focus dùng cùng một geometry.
 * Focus chỉ phóng to canvas, không thay đổi
 * vị trí, tỷ lệ hoặc khoảng cách các cột ghế.
 */
export function buildCabinLayout({
    rows,
    usableWidth,
    usableHeight,
    fare = "economy",
}) {
    const safeWidth = Math.max(
        1,
        Number(usableWidth) || 1,
    );

    const safeHeight = Math.max(
        1,
        Number(usableHeight) || 1,
    );

    const expectedColumns =
        getExpectedColumns(rows);

    const columnGroups =
        inferSeatGroups(expectedColumns);

    const columnCount = Math.max(
        expectedColumns.length,
        1,
    );

    const groupCount = Math.max(
        columnGroups.length,
        1,
    );

    const aisleCount =
        groupCount > 1
            ? groupCount - 1
            : 1;

    const rowCount = Math.max(
        rows.length,
        1,
    );

    /*
     * Cabin có ít cột thì không cần trải quá rộng.
     * Cabin 9–10 cột sẽ tự dùng nhiều chiều ngang hơn.
     */
    const horizontalFillRatio = clamp(
        0.48 + columnCount * 0.04,
        0.58,
        0.86,
    );

    const targetContentWidth =
        safeWidth * horizontalFillRatio;

    /*
     * Aisle tính theo đơn vị slot.
     * Máy bay ba cụm có hai aisle nhỏ hơn
     * để tránh chiếm quá nhiều chiều ngang.
     */
    const aisleSlotRatio =
        groupCount >= 3 ? 0.68 : 0.82;

    const totalHorizontalUnits =
        columnCount +
        aisleCount * aisleSlotRatio;

    const slotWidth =
        targetContentWidth /
        Math.max(totalHorizontalUnits, 1);

    const aisleWidth =
        slotWidth * aisleSlotRatio;

    /*
     * Khoảng nghỉ nhẹ sau mỗi 10 hàng Economy.
     */
    const breakEvery =
        fare === "economy" && rowCount >= 24
            ? 10
            : 0;

    const breakCount = breakEvery
        ? Math.floor((rowCount - 1) / breakEvery)
        : 0;

    const blockGap = breakCount
        ? clamp(
            safeHeight * 0.003,
            1.5,
            5,
        )
        : 0;

    const rowsHeight = Math.max(
        1,
        safeHeight - breakCount * blockGap,
    );

    const rowStep =
        rowsHeight / rowCount;

    const verticalFill =
        fare === "first"
            ? 0.88
            : fare === "business"
                ? 0.90
                : 0.92;

    const seatHeight = clamp(
        rowStep * verticalFill,
        3,
        fare === "first"
            ? 27
            : fare === "business"
                ? 25
                : 23,
    );

    /*
     * Seat icon giữ tỷ lệ ghế.
     * Không dùng toàn bộ slotWidth làm width ghế.
     * Slot dùng để căn cột, icon nằm giữa slot.
     */
    const seatWidth = clamp(
        Math.min(
            slotWidth * 0.92,
            seatHeight * 0.98,
        ),
        3,
        fare === "first"
            ? 28
            : fare === "business"
                ? 26
                : 24,
    );

    const tracks = buildTracks(
        columnGroups,
        slotWidth,
        aisleWidth,
    );

    const contentWidth = tracks.reduce(
        (sum, track) => sum + track.width,
        0,
    );

    const horizontalPadding = Math.max(
        0,
        (safeWidth - contentWidth) / 2,
    );

    const rowOffset = Math.max(
        0,
        (rowStep - seatHeight) / 2,
    );

    const contentHeight =
        rowStep * rowCount +
        blockGap * breakCount;

    const lastRowBottom =
        contentHeight -
        rowStep +
        rowOffset +
        seatHeight;

    return {
        expectedColumns,
        columnGroups,
        tracks,
        groupCount,
        aisleCount,

        slotWidth,
        seatWidth,
        seatHeight,

        // Giữ field cũ để component không lỗi.
        columnGap: 0,

        aisleWidth,
        rowStep,
        rowOffset,
        contentWidth,
        contentHeight,
        horizontalPadding,
        breakEvery,
        blockGap,

        gridTemplateColumns: tracks
            .map((track) => `${track.width}px`)
            .join(" "),

        isInteractiveAtOneToOne:
            seatWidth >= 10,

        valid:
            contentWidth <= safeWidth + 0.5 &&
            contentHeight <= safeHeight + 0.5 &&
            seatHeight <= rowStep + 0.5 &&
            lastRowBottom <= safeHeight + 0.5,
    };
}

export function cabinWeight(fare) {
    return CABIN_WEIGHTS[fare] || 1;
}