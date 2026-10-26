import {useState, type ChangeEvent} from "react";

type TripFormData = {
    tripName: string;
    tripType: string;
    destination: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    description: string;
};

const tripType = [
    "Adventure",
    "Beach",
    "Cruises",
    "City Break",
    "Road Trip",
    "Hiking",
    "Family",
    "Culture and Heritage",
    "Festival",
    "Staycation",
    "Other"
];

export default function createTrip() {
const [formData, setFormData] = useState<TripFormData>({
    tripName:"",
    tripType:"",
    destination:"",
    startDate:"",
    endDate:"",
    startTime:"",
    endTime:"",
    description:"",
});

const handleChange = (event: ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>
) => {
    const {name, value} = event.target;
    setFormData((prev) =>({... prev, [name]: value}));
};

const handleSubmit= (e:any) => {
    e.preventDefault();
    console.log("Saving trip:", formData);
};
const handleCancel= () => {
    setFormData({
        tripName:"",
        tripType:"",
        destination:"",
        startDate:"",
        endDate:"",
        startTime:"",
        endTime:"",
        description:"",
    })
}
    return (
            <>
                <div className=" bg-gray-50 py-1 px-4 sm:px-6 lg:px-8"/>
                    <div className="max-w-3xl mx-auto">
                        {/*header*/}
                        <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#031136]">
                        Create Trip
                        </h1>

                        {/*form*/}
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8 space-y-5 sm:space-y-6">
                        {/*Start from*/}

                            {/*Trip Name*/}
                            <div>
                                <label
                                htmlFor="tripName"
                                className="block text-sm font-medium text=[#031136] mb-1.5"
                                >
                                Trip name
                                </label>
                                <input
                                type="text"
                                id="tripName"
                                name="tripName"
                                value={formData.tripName}
                                onChange={handleChange}
                                placeholder="Trip name"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus-ring-[#FF59903] focus:border-tranparent text-sm"
                                required
                                />
                            </div>

                            {/*Trip Type*/}
                            <div>
                                <label
                                htmlFor="tripType"
                                className="block text-sm font-medium text=[#031136] mb-1.5"
                                >
                                  Trip type
                                </label>
                                <select
                                    id="tripType"
                                    name="tripType"
                                    value={formData.tripType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF59903] focus:border-tranparent text-sm]"
                                    required
                                    >
                                    <option value="">Select a type</option>
                                    {tripType.map((type)=>(
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                    </select>
                            </div>
                            {/*Destination*/}
                            <div>
                                <label
                                    htmlFor="destination"
                                    className="block text-sm font-medium text=[#031136] mb-1.5"
                                    >
                                    Destination
                                </label>
                                <input
                                    type="text"
                                    id="destination"
                                    name="destination"
                                    value={formData.destination}
                                    onChange={handleChange}
                                    placeholder="City or Place"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF59903] focus:border-tranparent text-sm"
                                    required
                                    />
                            </div>

                            {/*Dates*/}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4"/>

                                    <div>
                                    <label htmlFor="startDate"
                                    className="block text-sm font-medium text-[#031136] mb-1.5"
                                    >Start date
                                    </label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF59903] focus:border-tranparent text-sm"
                                        required
                                    />
                                </div>
                            <div>
                                <label
                                    htmlFor="endDate"
                                    className="block text-sm font-medium text-[#031136] mb-1.5"
                                    >End date
                                </label>
                                <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-tranparent text-sm"
                                required
                                />
                            </div>
                        {/*Times*/}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        </div>
                <div>
                <label htmlFor="startTime"
                       className="block text-sm font-medium text-[#031136] mb-1.5"
                        >Start time
                        </label>
                    <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-tranparent text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="endTime"
                    className="block text-sm font-medium text-[#031136] mb-1.5">
                    End time
                    </label>
                    <input
                        type="time"
                        id="endTime"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-tranparent text-sm"
                        />
                </div>

                {/*Description*/}
                <div>
                    <label
                        htmlFor="description"
                        className="block text-sm font-medium text-[#031136] mb-1.5">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="What is this trip about?"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-tranparent text-sm"/>
                </div>
                {/*Buttons*/}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 sm:pt-4">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-[#434A90] text-[#434A90] font-medium hover-bg[#434A90]/5 transition text-sm">Cancel</button>
                <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#FF5903] text-white font-medium hover-bg[#FF5903]/90 transition shadow-sm text-sm">Save Trip</button>
                </div>
                        </form>
                </div>
            </div>
            </>
        )
}