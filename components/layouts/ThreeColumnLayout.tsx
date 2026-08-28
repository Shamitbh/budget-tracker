import {ReactElement} from "react";
import {Grid} from "@mantine/core"

interface Props {
    one: ReactElement;
    two: ReactElement;
    three: ReactElement;
}

export const ThreeColumnLayout = ({one, two, three}: Props) => {

    return (
        <div className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-8">
            <Grid grow
                  gutter={"sm"}
                  columns={10}
            >
                <Grid.Col span={"content"}>
                     {one}
                </Grid.Col>
                <Grid.Col span={"content"}>
                   {two}
                </Grid.Col>
                <Grid.Col span={"content"}>
                    {three}
                </Grid.Col>
            </Grid>
        </div>
    )
}
