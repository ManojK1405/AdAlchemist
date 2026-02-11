
import Title from './Title';
import { PricingTable } from '@clerk/clerk-react';

export default function Pricing() {

    return (
        <section id="pricing" className="py-20 bg-white/3 border-t border-white/6">
            <div className="max-w-6xl mx-auto px-4">

                <Title
                    title="Pricing"
                    heading="Pricing Plans"
                    description="Our pricings are simple and transparent, with no hidden fees."
                />

                <div className="flex flex-wrap items-center justify-center gap-6 max-w-5xl mx-auto">
                    <PricingTable appearance={{
                        variables:{
                            colorBackground:'none',
                        },
                        elements: {
                            card: 'border border-white/15 bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg shadow-black/30',

                            headerTitle: 'text-lg font-semibold text-white',

                            headerDescription: 'text-sm text-gray-300',

                            price: 'text-3xl font-bold text-white',

                            featureListItem: 'text-gray-300',

                            ctaButton: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg px-4 py-2 hover:from-indigo-700 hover:to-purple-700 transition shadow-md shadow-indigo-500/20'
                        }
                    }}/>
                </div>
            </div>
        </section>
    );
};